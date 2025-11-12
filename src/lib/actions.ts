
'use server';

export async function verifyAdminPassword(password: string) {
  'use server';
  // This is a simple check. In a real-world scenario, you'd use a more secure
  // method, potentially involving a database or a secure secret management service.
  if (password === 'VMRF@2025') {
    return { success: true };
  }
  return { success: false, message: 'Incorrect password.' };
}
