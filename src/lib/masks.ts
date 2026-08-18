export function maskCpfCnpj(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 14);

  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }

  return digits
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

export function maskPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d{1,4})$/, "$1-$2");
  }

  return digits
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d{1,4})$/, "$1-$2");
}

// Formats digits as a BRL amount while typing, e.g. "150050" -> "1.500,50".
export function maskCurrency(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";

  const padded = digits.padStart(3, "0");
  const centsPart = padded.slice(-2);
  const intPart = padded.slice(0, -2).replace(/^0+(?=\d)/, "");
  const withThousands = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return `${withThousands},${centsPart}`;
}

// Parses a masked BRL amount ("1.500,50") back into a number (1500.5).
export function parseCurrency(masked: string): number {
  if (!masked) return NaN;
  return Number(masked.replace(/\./g, "").replace(",", "."));
}
