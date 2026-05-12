/**
 * Відображення українського мобільного після +380 у вигляді «67 123-45-67»
 * (оператор + решта у форматі xxx-xx-xx).
 */
export function formatUaQuickSubmitPhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  let r = digits;
  if (r.startsWith("380")) r = r.slice(3);
  else if (r.startsWith("0")) r = r.slice(1);
  r = r.slice(0, 9);

  let out = "+380";
  if (r.length === 0) return out;
  const op = r.slice(0, 2);
  out += ` ${op}`;
  const rest = r.slice(2);
  if (!rest.length) return out;
  const a = rest.slice(0, 3);
  const b = rest.slice(3, 5);
  const c = rest.slice(5, 7);
  let tail = a;
  if (b) tail += `-${b}`;
  if (c) tail += `-${c}`;
  return `${out} ${tail}`;
}

export function isValidUaQuickSubmitPhone(formatted: string): boolean {
  return /^\+380\s\d{2}\s\d{3}-\d{2}-\d{2}$/.test(formatted.trim());
}
