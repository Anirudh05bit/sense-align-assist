export async function uploadFile(file: File) {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch("http://localhost:8000/vision/upload", {
    method: "POST",
    body: form,
  });

  return res.json();
}