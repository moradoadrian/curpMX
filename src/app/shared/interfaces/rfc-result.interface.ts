export interface RfcResult {
  valid: boolean;
  rfc: string;
  type: 'Física' | 'Moral' | 'Genérico' | '';
  birthOrFoundationDate: string;
  homoclave: string;
  message: string;
}
