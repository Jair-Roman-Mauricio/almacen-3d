import { failFile } from './file-parser.js';
/** Present ZIP members incrementally with workbook metadata before worksheets.
* ExcelJS 4.4.0 otherwise sometimes reads a worksheet before its model exists.
* Compressed member bytes stay unchanged; no cell XML is buffered here.
*/
export function orderedXlsxParts(bytes: Buffer): Buffer[] {
  let end = -1;
  for (let p = bytes.length - 22; p >= Math.max(0, bytes.length - 65557); p--)
    if (bytes.readUInt32LE(p) === 0x06054b50 && p + 22 + bytes.readUInt16LE(p + 20) === bytes.length) {
      end = p;
      break;
    }
  if (end < 0)
    failFile('El contenedor XLSX está corrupto.', 'FORMAT');
  const count = bytes.readUInt16LE(end + 10), directory = bytes.readUInt32LE(end + 16), members: {
    name: string;
    offset: number;
    end: number;
  }[] = [];
  let p = directory;
  for (let i = 0; i < count; i++) {
    if (p + 46 > end || bytes.readUInt32LE(p) !== 0x02014b50)
      failFile('El directorio XLSX no es válido.', 'FORMAT');
    const length = bytes.readUInt16LE(p + 28), extra = bytes.readUInt16LE(p + 30), comment = bytes.readUInt16LE(p + 32), offset = bytes.readUInt32LE(p + 42);
    if (p + 46 + length + extra + comment > end || offset + 30 > directory || bytes.readUInt32LE(offset) !== 0x04034b50)
      failFile('Un miembro XLSX está corrupto.', 'FORMAT');
    members.push({ name: bytes.subarray(p + 46, p + 46 + length).toString('utf8'), offset, end: 0 });
    p += 46 + length + extra + comment;
  }
  if (!members.length || p !== end)
    failFile('El XLSX no contiene miembros admitidos.', 'FORMAT');
  members.sort((a, b) => a.offset - b.offset);
  for (let i = 0; i < members.length; i++) {
    members[i]!.end = members[i + 1]?.offset ?? directory;
    if (members[i]!.end <= members[i]!.offset)
      failFile('El XLSX repite miembros.', 'FORMAT');
  }
  const priority = (name: string) => name === 'xl/workbook.xml' ? 0 : name === 'xl/_rels/workbook.xml.rels' ? 1 : name === 'xl/sharedStrings.xml' ? 2 : 3;
  members.sort((a, b) => priority(a.name) - priority(b.name) || a.offset - b.offset);
  return [...members.map(m => bytes.subarray(m.offset, m.end)), bytes.subarray(directory)];
}
