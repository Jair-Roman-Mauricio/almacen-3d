import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createSchemaFixture, seedIdentity, seedWarehouse, seedProduct, seedStock, seedOrder, seedTransfer, seedCount, seedCommand, type SchemaFixture } from './schema-fixture.js';
let db: SchemaFixture;
beforeAll(async () => { db = await createSchemaFixture(); });
afterAll(async () => { if (db) await db.close(); });
describe('I-SET/esquema-identidad', () => {
  it('mantiene paridad de mayúsculas/minúsculas con el Unicode del runtime fijado', async () => {
    const values: string[] = [];
    for (let point=0;point<=0x10ffff;point++) {
      const value=String.fromCodePoint(point);
      if (value.toUpperCase()!==value || value.toLowerCase()!==value) values.push(value);
    }
    const rows=(await db.owner.query('SELECT value,app.code_key(value) AS upper,app.email_key(value) AS lower FROM unnest($1::text[]) AS value',[values])).rows;
    expect(rows.filter(row=>row.upper!==row.value.normalize('NFC').toUpperCase().normalize('NFC') || row.lower!==row.value.normalize('NFC').toLowerCase())).toEqual([]);
  });
  it('admite las categorías Unicode de letras/números del dominio, incluidos numerales y fracciones', async () => {
    for (const value of ['A²','AⅣ','A½','A١','A部','Aé','A𐐀']) {
      expect((await db.owner.query('SELECT app.valid_code($1) AS valid',[value])).rows[0].valid).toBe(true);
    }
    for (const value of ['Aि','A b','A@','😀']) {
      expect((await db.owner.query('SELECT app.valid_code($1) AS valid',[value])).rows[0].valid).toBe(false);
    }
  });
  it('permite el mismo correo en empresas distintas y rechaza duplicado dentro de la empresa', async () => {
    const seed = await seedIdentity(db.owner);
    expect((await db.owner.query('SELECT count(*)::int AS n FROM app.users WHERE tenant_id IN ($1,$2)', [seed.tenant, seed.otherTenant])).rows[0].n).toBe(2);
    await expect(db.owner.query("INSERT INTO app.users(tenant_id,id,name,email,password_hash,role) VALUES ($1,$2,'Otro',' ADMIN@EXAMPLE.TEST ','hash','operator')", [seed.tenant, randomUUID()])).rejects.toMatchObject({ code: '23505' });
  });
  it('protege el código global normalizado y comparte NFC/mayúsculas Unicode con dominio', async () => {
    const code = 'e\u0301-ß-' + randomUUID();
    await db.owner.query('INSERT INTO app.companies(id,code,name) VALUES ($1,$2,$3)', [randomUUID(), code, 'Empresa']);
    await expect(db.owner.query('INSERT INTO app.companies(id,code,name) VALUES ($1,$2,$3)', [randomUUID(), '  ' + code.normalize('NFC').toUpperCase() + '  ', 'Otra'])).rejects.toMatchObject({ code: '23505' });
  });
  it('limita instalación a una fila, rol permitido y sesión a usuario de la misma empresa', async () => {
    const seed = await seedIdentity(db.owner);
    await db.owner.query("INSERT INTO app.installation(singleton,mode,schema_version) VALUES (true,'local',1)");
    await expect(db.owner.query("INSERT INTO app.installation(singleton,mode,schema_version) VALUES (true,'saas',1)")).rejects.toMatchObject({ code: '23505' });
    await expect(db.owner.query("INSERT INTO app.users(tenant_id,id,name,email,password_hash,role) VALUES ($1,$2,'Otro','other@example.test','hash','global_admin')", [seed.tenant, randomUUID()])).rejects.toMatchObject({ code: '23514' });
    await expect(db.owner.query('INSERT INTO app.sessions(tenant_id,id,user_id,token_hash) VALUES ($1,$2,$3,$4)', [seed.tenant, randomUUID(), seed.otherActor, 'a'.repeat(64)])).rejects.toMatchObject({ code: '23503' });
  });
});

describe('I-GEO/esquema-ambito', () => {
  it('impide padres de otro almacén o empresa y jerarquías incompatibles', async () => {
    const seed = await seedIdentity(db.owner);
    const a = await seedWarehouse(db.owner, seed.tenant);
    const b = await seedWarehouse(db.owner, seed.tenant);
    const c = await seedWarehouse(db.owner, seed.otherTenant);
    const insert = (parent: string, parentType = 'zone', type = 'location') => db.owner.query("INSERT INTO app.layout_elements(tenant_id,warehouse_id,id,type,parent_id,parent_type,code,name,width,height,depth) VALUES ($1,$2,$3,$4,$5,$6,$7,'Elemento',1,1,1)", [seed.tenant,a.warehouse,randomUUID(),type,parent,parentType,'U-'+randomUUID()]);
    await expect(insert(b.zone)).rejects.toMatchObject({ code: '23503' });
    await expect(insert(c.zone)).rejects.toMatchObject({ code: '23503' });
    await expect(insert(a.zone,'zone','level')).rejects.toMatchObject({ code: '23514' });
  });
  it('conserva identidad, revisión y bloqueo y protege códigos por almacén', async () => {
    const seed = await seedIdentity(db.owner); const a = await seedWarehouse(db.owner, seed.tenant);
    await db.owner.query('UPDATE app.layout_elements SET blocked = true WHERE tenant_id=$1 AND id=$2', [seed.tenant,a.location]);
    await db.owner.query('UPDATE app.warehouses SET layout_revision=layout_revision+1 WHERE tenant_id=$1 AND id=$2', [seed.tenant,a.warehouse]);
    expect((await db.owner.query('SELECT id,blocked FROM app.layout_elements WHERE tenant_id=$1 AND id=$2',[seed.tenant,a.location])).rows).toEqual([{id:a.location,blocked:true}]);
    expect((await db.owner.query('SELECT layout_revision::text AS revision FROM app.warehouses WHERE tenant_id=$1 AND id=$2',[seed.tenant,a.warehouse])).rows[0].revision).toBe('1');
    await expect(db.owner.query("INSERT INTO app.layout_elements(tenant_id,warehouse_id,id,type,parent_id,parent_type,code,name,width,height,depth) VALUES ($1,$2,$3,'location',$4,'zone',' u/1 ','Duplicada',1,1,1)",[seed.tenant,a.warehouse,randomUUID(),a.zone])).rejects.toMatchObject({code:'23505'});
  });
});

describe('I-CAT/esquema-producto', () => {
  it('protege SKU por empresa y conserva ID/unidad al cambiar nombre', async () => {
    const seed = await seedIdentity(db.owner);
    const product = await seedProduct(db.owner, seed.tenant);
    const before = (await db.owner.query('SELECT id,sku,unit_kind,unit_label FROM app.products WHERE tenant_id=$1 AND id=$2',[seed.tenant,product])).rows[0];
    await db.owner.query("UPDATE app.products SET name='Motor actualizado' WHERE tenant_id=$1 AND id=$2",[seed.tenant,product]);
    expect((await db.owner.query('SELECT id,sku,unit_kind,unit_label FROM app.products WHERE tenant_id=$1 AND id=$2',[seed.tenant,product])).rows[0]).toEqual(before);
    await expect(db.owner.query("INSERT INTO app.products(tenant_id,id,sku,name,unit_kind,unit_label) VALUES ($1,$2,$3,'Duplicado','piece','pieza')",[seed.tenant,randomUUID(),' '+before.sku.toLowerCase()+' '])).rejects.toMatchObject({code:'23505'});
    await db.owner.query("INSERT INTO app.products(tenant_id,id,sku,name,unit_kind,unit_label) VALUES ($1,$2,$3,'Otra empresa','weight','kg')",[seed.otherTenant,randomUUID(),before.sku]);
  });
  it('ausencia de umbral no genera fila y admite cero sin mezclar ámbitos', async () => {
    const seed = await seedIdentity(db.owner); const w = await seedWarehouse(db.owner,seed.tenant); const p = await seedProduct(db.owner,seed.tenant); const other = await seedProduct(db.owner,seed.otherTenant);
    expect((await db.owner.query('SELECT * FROM app.stock_thresholds WHERE tenant_id=$1',[seed.tenant])).rowCount).toBe(0);
    await db.owner.query('INSERT INTO app.stock_thresholds(tenant_id,warehouse_id,product_id,quantity) VALUES ($1,$2,$3,0)',[seed.tenant,w.warehouse,p]);
    await expect(db.owner.query('INSERT INTO app.stock_thresholds(tenant_id,warehouse_id,product_id,quantity) VALUES ($1,$2,$3,1)',[seed.tenant,w.warehouse,other])).rejects.toMatchObject({code:'23503'});
    await expect(db.owner.query('UPDATE app.stock_thresholds SET quantity=-1 WHERE tenant_id=$1',[seed.tenant])).rejects.toMatchObject({code:'23514'});
    await expect(db.owner.query('UPDATE app.stock_thresholds SET quantity=1.0001 WHERE tenant_id=$1',[seed.tenant])).rejects.toMatchObject({code:'23514'});
  });
  it('rechaza una categoría de unidad no admitida', async () => {
    const seed = await seedIdentity(db.owner);
    await expect(db.owner.query("INSERT INTO app.products(tenant_id,id,sku,name,unit_kind,unit_label) VALUES ($1,$2,'BAD','Producto','automatic_conversion','?')",[seed.tenant,randomUUID()])).rejects.toMatchObject({code:'23514'});
  });
});

describe('I-INV/restricciones-db', () => {
  it('persiste numeric exacto sin redondear y rechaza negativos, no finitos y exceso de precisión', async () => {
    const seed = await seedIdentity(db.owner); const w = await seedWarehouse(db.owner,seed.tenant); const p = await seedProduct(db.owner,seed.tenant);
    const insert = (physical: string, reserved = '0') => db.owner.query('INSERT INTO app.stock_balances(tenant_id,warehouse_id,location_id,product_id,physical,reserved) VALUES ($1,$2,$3,$4,$5,$6)',[seed.tenant,w.warehouse,w.location,p,physical,reserved]);
    for (const value of ['-1','NaN','Infinity','-Infinity','1.2345','1.0000']) await expect(insert(value)).rejects.toMatchObject({code:'23514'});
    await expect(insert('1','2')).rejects.toMatchObject({code:'23514'});
    await insert('900719925474099312345678901.123','0.001');
    expect((await db.owner.query('SELECT physical::text AS physical,reserved::text AS reserved FROM app.stock_balances WHERE tenant_id=$1',[seed.tenant])).rows).toEqual([{physical:'900719925474099312345678901.123',reserved:'0.001'}]);
  });
  it('incrementa revisión solo al cambiar físico, conserva A→B→A y registra asientos vinculados', async () => {
    const seed = await seedIdentity(db.owner); const w = await seedWarehouse(db.owner,seed.tenant); const p = await seedProduct(db.owner,seed.tenant);
    await db.owner.query('INSERT INTO app.stock_balances(tenant_id,warehouse_id,location_id,product_id,physical,reserved) VALUES ($1,$2,$3,$4,100,40)',[seed.tenant,w.warehouse,w.location,p]);
    await db.owner.query('UPDATE app.stock_balances SET physical=90, physical_revision=999 WHERE tenant_id=$1',[seed.tenant]);
    await db.owner.query('UPDATE app.stock_balances SET reserved=30 WHERE tenant_id=$1',[seed.tenant]);
    expect((await db.owner.query('SELECT physical_revision::text AS revision FROM app.stock_balances WHERE tenant_id=$1',[seed.tenant])).rows[0].revision).toBe('1');
    await db.owner.query('UPDATE app.stock_balances SET physical=100 WHERE tenant_id=$1',[seed.tenant]);
    expect((await db.owner.query('SELECT physical_revision::text AS revision FROM app.stock_balances WHERE tenant_id=$1',[seed.tenant])).rows[0].revision).toBe('2');
    await db.owner.query("INSERT INTO app.inventory_entries(tenant_id,id,operation_reference,product_id,warehouse_id,location_id,actor_id,kind,physical_delta,reserved_delta,transit_delta) VALUES ($1,$2,$3,$4,$5,$6,$7,'receipt',10,0,0)",[seed.tenant,randomUUID(),await seedCommand(db.owner,seed.tenant,seed.actor),p,w.warehouse,w.location,seed.actor]);
  });
  it('impide stock sobre un rack y producto de otra empresa', async () => {
    const seed = await seedIdentity(db.owner); const w = await seedWarehouse(db.owner,seed.tenant); const p = await seedProduct(db.owner,seed.tenant); const other = await seedProduct(db.owner,seed.otherTenant);
    await expect(db.owner.query('INSERT INTO app.stock_balances(tenant_id,warehouse_id,location_id,product_id) VALUES ($1,$2,$3,$4)',[seed.tenant,w.warehouse,w.zone,p])).rejects.toMatchObject({code:'23503'});
    await expect(db.owner.query('INSERT INTO app.stock_balances(tenant_id,warehouse_id,location_id,product_id) VALUES ($1,$2,$3,$4)',[seed.tenant,w.warehouse,w.location,other])).rejects.toMatchObject({code:'23503'});
  });
});

describe('I-OUT/esquema-pedido', () => {
  it('vincula asignación a la línea, producto y ubicación correctos', async () => {
    const seed=await seedIdentity(db.owner); const w=await seedWarehouse(db.owner,seed.tenant); const p=await seedProduct(db.owner,seed.tenant); const other=await seedProduct(db.owner,seed.tenant);
    await seedStock(db.owner,seed.tenant,w.warehouse,w.location,p); await seedStock(db.owner,seed.tenant,w.warehouse,w.location,other);
    const order=await seedOrder(db.owner,seed.tenant,w.warehouse,p); const allocation=randomUUID();
    await db.owner.query('INSERT INTO app.allocations(tenant_id,warehouse_id,id,order_id,line_id,product_id,location_id,reserved,prepared_pending) VALUES ($1,$2,$3,$4,$5,$6,$7,40,10)',[seed.tenant,w.warehouse,allocation,order.order,order.line,p,w.location]);
    await expect(db.owner.query('UPDATE app.allocations SET product_id=$1 WHERE tenant_id=$2 AND id=$3',[other,seed.tenant,allocation])).rejects.toMatchObject({code:'23503'});
    await expect(db.owner.query('UPDATE app.allocations SET prepared_pending=41 WHERE tenant_id=$1 AND id=$2',[seed.tenant,allocation])).rejects.toMatchObject({code:'23514'});
    await expect(db.owner.query('UPDATE app.order_lines SET dispatched=101 WHERE tenant_id=$1 AND id=$2',[seed.tenant,order.line])).rejects.toMatchObject({code:'23514'});
  });
  it('rechaza operario asignado y producto de otra empresa', async () => {
    const seed=await seedIdentity(db.owner); const w=await seedWarehouse(db.owner,seed.tenant); const p=await seedProduct(db.owner,seed.tenant); const other=await seedProduct(db.owner,seed.otherTenant); const order=await seedOrder(db.owner,seed.tenant,w.warehouse,p);
    await expect(db.owner.query('UPDATE app.orders SET assigned_operator_id=$1 WHERE tenant_id=$2 AND id=$3',[seed.otherActor,seed.tenant,order.order])).rejects.toMatchObject({code:'23503'});
    await expect(db.owner.query('UPDATE app.order_lines SET product_id=$1 WHERE tenant_id=$2 AND id=$3',[other,seed.tenant,order.line])).rejects.toMatchObject({code:'23503'});
  });
});

describe('I-TRA/esquema-traslado', () => {
  it('impide extremos ajenos y almacenes iguales', async () => {
    const seed=await seedIdentity(db.owner); const a=await seedWarehouse(db.owner,seed.tenant); const b=await seedWarehouse(db.owner,seed.otherTenant);
    const insert=(target:string)=>db.owner.query('INSERT INTO app.transfers(tenant_id,id,code,source_warehouse_id,target_warehouse_id) VALUES ($1,$2,$3,$4,$5)',[seed.tenant,randomUUID(),'T-'+randomUUID(),a.warehouse,target]);
    await expect(insert(b.warehouse)).rejects.toMatchObject({code:'23503'});
    await expect(insert(a.warehouse)).rejects.toMatchObject({code:'23514'});
  });
  it('protege salida completa y recibido acumulado exacto por línea', async () => {
    const seed=await seedIdentity(db.owner); const a=await seedWarehouse(db.owner,seed.tenant); const b=await seedWarehouse(db.owner,seed.tenant); const p=await seedProduct(db.owner,seed.tenant); await seedStock(db.owner,seed.tenant,a.warehouse,a.location,p);
    const t=await seedTransfer(db.owner,seed.tenant,a.warehouse,b.warehouse,a.location,p);
    await expect(db.owner.query('UPDATE app.transfer_lines SET departed=19 WHERE tenant_id=$1 AND id=$2',[seed.tenant,t.line])).rejects.toMatchObject({code:'23514'});
    await expect(db.owner.query('UPDATE app.transfer_lines SET received=1 WHERE tenant_id=$1 AND id=$2',[seed.tenant,t.line])).rejects.toMatchObject({code:'23514'});
    await db.owner.query('UPDATE app.transfer_lines SET departed=20,received=7 WHERE tenant_id=$1 AND id=$2',[seed.tenant,t.line]);
    expect((await db.owner.query('SELECT in_transit::text AS n FROM app.transfer_lines WHERE tenant_id=$1 AND id=$2',[seed.tenant,t.line])).rows[0].n).toBe('13');
    await expect(db.owner.query('UPDATE app.transfer_lines SET received=21 WHERE tenant_id=$1 AND id=$2',[seed.tenant,t.line])).rejects.toMatchObject({code:'23514'});
  });
});

describe('I-TRA/recepciones-destino', () => {
  it('persiste una recepción y limita el desglose al producto/destino de la línea', async () => {
    const seed=await seedIdentity(db.owner); const a=await seedWarehouse(db.owner,seed.tenant); const b=await seedWarehouse(db.owner,seed.tenant); const p=await seedProduct(db.owner,seed.tenant);
    await seedStock(db.owner,seed.tenant,a.warehouse,a.location,p); await seedStock(db.owner,seed.tenant,b.warehouse,b.location,p);
    const t=await seedTransfer(db.owner,seed.tenant,a.warehouse,b.warehouse,a.location,p); const receipt=randomUUID();
    await db.owner.query('INSERT INTO app.transfer_receipts(tenant_id,id,transfer_id,operation_reference,actor_id) VALUES ($1,$2,$3,$4,$5)',[seed.tenant,receipt,t.transfer,await seedCommand(db.owner,seed.tenant,seed.actor),seed.actor]);
    await db.owner.query('INSERT INTO app.transfer_receipt_lines(tenant_id,receipt_id,transfer_id,line_id,product_id,target_warehouse_id,target_location_id,quantity) VALUES ($1,$2,$3,$4,$5,$6,$7,7)',[seed.tenant,receipt,t.transfer,t.line,p,b.warehouse,b.location]);
    await expect(db.owner.query('UPDATE app.transfer_receipt_lines SET target_warehouse_id=$1,target_location_id=$2 WHERE tenant_id=$3 AND receipt_id=$4',[a.warehouse,a.location,seed.tenant,receipt])).rejects.toMatchObject({code:'23503'});
  });
});

describe('I-CNT/esquema-conteo', () => {
  it('guarda cero observado y referencia específica sin cambiar físico', async () => {
    const seed=await seedIdentity(db.owner); const w=await seedWarehouse(db.owner,seed.tenant); const p=await seedProduct(db.owner,seed.tenant); await seedStock(db.owner,seed.tenant,w.warehouse,w.location,p);
    const count=await seedCount(db.owner,seed,w.warehouse,w.location,p);
    expect((await db.owner.query('SELECT observed::text,reference_physical::text,reference_revision::text,difference::text FROM app.counts WHERE tenant_id=$1 AND id=$2',[seed.tenant,count])).rows[0]).toEqual({observed:'0',reference_physical:'100',reference_revision:'0',difference:'-100'});
    expect((await db.owner.query('SELECT physical::text FROM app.stock_balances WHERE tenant_id=$1',[seed.tenant])).rows[0].physical).toBe('100');
  });
  it('impide ajustar un conteo usando otro producto o ubicación', async () => {
    const seed=await seedIdentity(db.owner); const w=await seedWarehouse(db.owner,seed.tenant); const p=await seedProduct(db.owner,seed.tenant); const other=await seedProduct(db.owner,seed.tenant); await seedStock(db.owner,seed.tenant,w.warehouse,w.location,p); await seedStock(db.owner,seed.tenant,w.warehouse,w.location,other);
    const count=await seedCount(db.owner,seed,w.warehouse,w.location,p);
    const insert=async(product:string,reason:string)=>db.owner.query('INSERT INTO app.adjustments(tenant_id,id,warehouse_id,count_id,location_id,product_id,authorized_physical,reason,actor_id,operation_reference) VALUES ($1,$2,$3,$4,$5,$6,0,$7,$8,$9)',[seed.tenant,randomUUID(),w.warehouse,count,w.location,product,reason,seed.actor,await seedCommand(db.owner,seed.tenant,seed.actor)]);
    await expect(insert(other,'Conteo autorizado')).rejects.toMatchObject({code:'23503'});
    await expect(insert(p,'  ')).rejects.toMatchObject({code:'23514'});
    await insert(p,'Conteo autorizado');
    await expect(insert(p,'Repetido')).rejects.toMatchObject({code:'23505'});
  });
});

describe('I-CMD/esquema-comando', () => {
  it('hace la referencia única por empresa pero repetible entre empresas', async () => {
    const seed=await seedIdentity(db.owner); const reference=randomUUID();
    await seedCommand(db.owner,seed.tenant,seed.actor,reference);
    await seedCommand(db.owner,seed.otherTenant,seed.otherActor,reference);
    await expect(seedCommand(db.owner,seed.tenant,seed.actor,reference)).rejects.toMatchObject({code:'23505'});
    expect((await db.owner.query('SELECT result FROM app.commands WHERE tenant_id=$1 AND reference=$2',[seed.tenant,reference])).rows[0].result).toEqual({synthetic:true});
  });
  it('conserva resultado, auditoría y aviso enlazados y rechaza confirmación incompleta', async () => {
    const seed=await seedIdentity(db.owner); const reference=await seedCommand(db.owner,seed.tenant,seed.actor);
    await db.owner.query("INSERT INTO app.audit_events(tenant_id,id,operation_reference,actor_id,kind,entity_id,details) VALUES ($1,$2,$3,$4,'assignment',$5,'{}')",[seed.tenant,randomUUID(),reference,seed.actor,randomUUID()]);
    await db.owner.query("INSERT INTO app.change_outbox(tenant_id,id,operation_reference,scopes) VALUES ($1,$2,$3,'[]')",[seed.tenant,randomUUID(),reference]);
    expect((await db.owner.query('SELECT count(*)::int AS n FROM app.change_outbox WHERE tenant_id=$1 AND published_at IS NULL',[seed.tenant])).rows[0].n).toBe(1);
    await expect(db.owner.query("UPDATE app.commands SET result=NULL WHERE tenant_id=$1 AND reference=$2",[seed.tenant,reference])).rejects.toMatchObject({code:'23514'});
    await expect(db.owner.query("INSERT INTO app.change_outbox(tenant_id,id,operation_reference,scopes) VALUES ($1,$2,$3,'[]')",[seed.tenant,randomUUID(),randomUUID()])).rejects.toMatchObject({code:'23503'});
  });
});

describe('I-EXC/staging-aislado', () => {
  it('guarda preview/errores/huella sin modificar catálogo o stock', async () => {
    const seed=await seedIdentity(db.owner); const w=await seedWarehouse(db.owner,seed.tenant); const p=await seedProduct(db.owner,seed.tenant); await seedStock(db.owner,seed.tenant,w.warehouse,w.location,p); const job=randomUUID();
    const before=(await db.owner.query('SELECT physical::text FROM app.stock_balances WHERE tenant_id=$1',[seed.tenant])).rows;
    await db.owner.query("INSERT INTO app.import_jobs(tenant_id,id,actor_id,kind,state,file_name,bytes,row_count,content_hash) VALUES ($1,$2,$3,'catalogue','preview','sintetico.csv',100,1,$4)",[seed.tenant,job,seed.actor,'b'.repeat(64)]);
    await db.owner.query("INSERT INTO app.import_rows(tenant_id,job_id,row_no,action,values,errors) VALUES ($1,$2,2,'create',$3,$4)",[seed.tenant,job,JSON.stringify({sku:'NUEVO',name:'Propuesto'}),JSON.stringify([{field:'unit',reason:'Falta unidad'}])]);
    expect((await db.owner.query('SELECT physical::text FROM app.stock_balances WHERE tenant_id=$1',[seed.tenant])).rows).toEqual(before);
    expect((await db.owner.query('SELECT count(*)::int AS n FROM app.products WHERE tenant_id=$1',[seed.tenant])).rows[0].n).toBe(1);
    expect((await db.owner.query('SELECT errors FROM app.import_rows WHERE tenant_id=$1 AND job_id=$2',[seed.tenant,job])).rows[0].errors).toEqual([{field:'unit',reason:'Falta unidad'}]);
    await expect(db.owner.query("INSERT INTO app.import_rows(tenant_id,job_id,row_no,values) VALUES ($1,$2,3,'{}')",[seed.otherTenant,job])).rejects.toMatchObject({code:'23503'});
  });
});
