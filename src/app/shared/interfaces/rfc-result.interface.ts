export interface RfcResult {
  valid: boolean;
  rfc: string;
  type: 'Física' | 'Moral' | '';
  birthOrFoundationDate: string;
  homoclave: string;
  message: string;
}
