export interface CurpResult {
  valid: boolean;
  curp: string;
  birthDate: string;
  age: number;
  gender: string;
  state: string;
  verifierValid: boolean;
  message: string;
}
