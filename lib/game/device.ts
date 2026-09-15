const DEVICE_ID_KEY = "quantum_device_id";

export function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

// Usado por "Cambiar de usuario": borra la identidad de este celular para
// que la próxima llamada a getDeviceId() genere una nueva. El caller es
// responsable de soltar el device_id previo en la fila de `players` antes
// de llamar esto (ver PlayApp.changeUser).
export function resetDeviceId(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DEVICE_ID_KEY);
}
