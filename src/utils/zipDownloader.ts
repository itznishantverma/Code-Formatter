import JSZip from 'jszip';
import { ParsedFile } from './logParser';

export async function downloadAsZip(files: ParsedFile[], projectName: string = 'parsed-project') {
  const zip = new JSZip();

  files.forEach(file => {
    const filePath = file.path.startsWith('/') ? file.path.slice(1) : file.path;
    zip.file(filePath, file.content);
  });

  const blob = await zip.generateAsync({ type: 'blob' });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${projectName}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
