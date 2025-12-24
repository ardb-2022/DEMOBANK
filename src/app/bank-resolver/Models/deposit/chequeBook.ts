export interface ChequeBook {
  acc_type_cd: number;          // Account type code
  acc_num: string;
  acc_name:string              // Account number
  chq_bk_no: string;            // Cheque book number
  issue_dt: Date;               // Issue date
  chq_no_from: string;          // Cheque number from
  chq_no_to: string;            // Cheque number to
  approval_status: string;      // Approval status
  created_by: string;           // Created by
  created_dt: Date;             // Created date
  approved_by: string;          // Approved by
  approved_dt?: Date | null;    // Approved date (nullable)
  chq_version: number;          // Cheque version
  brn_cd:any;
}
// Additional interfaces for UI support
export interface Cheque {
  chq_no: string;
  chq_status: 'I'| 'U';
}

export interface AccountInfo {
  acc_type_cd: number;
  acc_num: string;
  issue_dt: string;
  chq_no_from: string;
  chq_no_to: string;
  acc_name?: string; // For display purposes
}

export interface AccountType {
  code: number;
  name: string;
}