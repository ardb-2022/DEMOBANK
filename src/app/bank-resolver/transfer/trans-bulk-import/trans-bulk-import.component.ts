import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, signal, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { RestService } from 'src/app/_service';
import { AccountDetailsComponent } from '../../Common/account-details/account-details.component';
import { AccounTransactionsComponent } from '../../deposit/accoun-transactions/accoun-transactions.component';
import { MessageType, mm_acc_type, mm_customer, mm_operation, m_acc_master, ShowMessage, SystemValues, td_def_trans_trf, tm_deposit } from '../../Models';
import { mm_constitution } from '../../Models/deposit/mm_constitution';
import { tm_transfer } from '../../Models/deposit/tm_transfer';
import { p_gen_param } from '../../Models/p_gen_param';
import { TransferDM } from '../../Models/TransferDM';
import * as XLSX from 'xlsx';
@Component({
  selector: 'app-trans-bulk-import',
  templateUrl: './trans-bulk-import.component.html',
  styleUrls: ['./trans-bulk-import.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransBulkImportComponent implements OnInit {

  constructor(private cdRef: ChangeDetectorRef,private router: Router, private frmBldr: FormBuilder, private modalService: BsModalService, private svc: RestService) { }
  isLoading = false;
  showMsg: ShowMessage;
  //td_deftrans = new td_def_trans_trf();
  get f() { return this.tmtransfer.controls; }
  @ViewChild('contentbatch', { static: true }) contentbatch: TemplateRef<any>;
  modalRef: BsModalRef;
  tmtransfer: FormGroup;
  approveDisable:boolean=true;
  td_deftranstrfList: td_def_trans_trf[] = [];
  cr_td_deftranstrfList: td_def_trans_trf[] = [];
  tm_transfer = new tm_transfer();
  unApprovedTransactionLst: tm_transfer[] = [];
  accountTypeList: mm_acc_type[] = [];
  sys = new SystemValues();
  acc_master: m_acc_master[] = [];
  suggestedCustomerCr: mm_customer[];
  indxsuggestedCustomerCr = 0;
  suggestedCustomerDr: mm_customer[];
  indxsuggestedCustomerDr = 0;
  showGlHeadDr=false;
  showGlHeadCr=false;
  TrfTotAmt = 0;
  CrTrfTotAmt = 0;
  isOpenFromDp = false;
  isRetrieve = true;
  maccmaster: m_acc_master[] = [];
  maccmasterRet: m_acc_master[] = [];
  constitutionList: mm_constitution[] = [];
  getCodeDr:any
  getCodeCr:any
  disabledOnNulldr=true;
  disabledOnNullcr=true;
  constCdDr:any;
  constCdCr:any;
  isGLinDr=null;
  isGLinCr=null;
  config = {
    keyboard: false, // ensure esc press doesnt close the modal
    backdrop: true, // enable backdrop shaded color
    ignoreBackdropClick: true // disable backdrop click to close the modal
  };





jsonDataView :any[] = []
  jsonData: any[] = [];
  fileName: string = '';
  isUploaded: boolean = false;
   totalDepAmount: number = 0;
   totalWthAmount: number = 0;
  ngOnInit(): void {
   this.getDataForView();
  }
checkFlag(flag: string): string {
    return flag === "Y" ? "✔️ Valid" : "❌ Error";
  }
    onFileChange(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.fileName = file.name; // 👉 save file name
    this.isUploaded = false;   // reset button visibility

    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      const binaryStr: string = e.target.result;
      const workbook: XLSX.WorkBook = XLSX.read(binaryStr, { type: 'binary' });

      const sheetName: string = workbook.SheetNames[0];
      const worksheet: XLSX.WorkSheet = workbook.Sheets[sheetName];

      // Convert Excel to JSON
      let data: any[] = XLSX.utils.sheet_to_json(worksheet, { raw: false });

      // Remove Excel's trans_dt and set runtime date
      this.jsonData = data.map(row => {
        return {
          sl_no: row["SL_NO"],
          brn_cd:this.sys.BranchCode,
          trans_type: row["TRANS_TYPE"],
          acc_type_cd: row["ACC_TYPE_CD"],
          acc_num: row["ACC_NUM"],
          amount: row["AMOUNT"],
          acc_cd: row["ACC_CD"],
          narration: row["NARRATION"],
          // 👉 runtime current date in ISO format
          trans_dt: this.sys.CurrentDate.toISOString(),
          created_by: this.sys.UserId.toString()
        };
      });
      if(this.jsonData){
      this.insertBulk();
      }
      // console.log( this.jsonData);
      this.isUploaded=true;
    };

    reader.readAsBinaryString(file);
  }
  clear(){
  this.jsonDataView = [];
  this.jsonData = [];
  this.fileName = '';
  this.isUploaded = false;
   this.totalDepAmount = 0;
   this.totalWthAmount = 0;
   this.showMsg.Show=null;
  }
 closeScreen()
  {
    this.router.navigate([localStorage.getItem('__bName') + '/la']);
  }
insertBulk(){
  debugger;
   console.log( this.jsonData);
    this.svc.addUpdDel<any>('Deposit/InsertBulkDepPosting', this.jsonData).subscribe(
      res => {

        console.log(res);
        
        if(res.status=="Success"){
          this.getDataForView();
        this.HandleMessage(true, MessageType.Sucess, 'File Successfully Upload ');
        this.isUploaded = true;
    
        }else{
          this.isUploaded = false;
          this.HandleMessage(true, MessageType.Error, 'Please Upload a Valid Format of File');
        }
      },
      err => {        this.isUploaded = false;
            this.HandleMessage(true, MessageType.Error, 'Please Upload a Valid Format of File');

      }
    );

}

getDataForView(){
  debugger
  this.jsonDataView=[]
  this.totalDepAmount=0;
  this.totalWthAmount=0;
      var dt={
        "brn_cd": this.sys.BranchCode,
        "adt_temp_dt": this.sys.CurrentDate.toISOString()
      }
    this.svc.addUpdDel<any>('Deposit/GetBulkDepPosting', dt).subscribe(res => {
        console.log("API Response:", res);

        if (Array.isArray(res) && res.length > 0) {
          const currUser = this.sys.UserId;
          this.approveDisable = (currUser === res[0]?.created_by);
          this.jsonDataView = [...res];
           this.jsonDataView.forEach(e => {
            if (e.trans_type === 'D') {
              this.totalDepAmount += e.amount;
            } else {
              this.totalWthAmount += e.amount;
            }
          });

          this.cdRef.detectChanges();

          

          this.HandleMessage(true, MessageType.Sucess, 'Data Fetch Successfully');

         
        } else {
          this.jsonDataView = [];
          this.HandleMessage(true, MessageType.Error, 'Data Fetch Issue');
        }
      },
    err=>{
          this.jsonDataView = [];
          this.HandleMessage(true, MessageType.Error, 'API Issue');
    });
}
allValid(): boolean {
    return this.jsonDataView.every(row =>
      row.acc_num_flag === 'Y' &&
      row.gl_flag === 'Y' &&
      row.balance_flag === 'Y'
    );
  }
  approveTrnsData(){
    var dt={
    "ardb_cd":this.sys.ardbCD,
    "brn_cd": this.sys.BranchCode,
    "adt_temp_dt": this.sys.CurrentDate.toISOString(),
    "gs_user_id":this.sys.UserId
  }
 this.svc.addUpdDel<any>('Deposit/ApproveBulkDepPosting',dt).subscribe(
      res => {
        const response=res;
          this.jsonDataView=[]
          this.totalDepAmount=0;
          this.totalWthAmount=0;
          if(response.status=='Success'){
            this.HandleMessage(true, MessageType.Sucess, 'Approve Successfully');
          }
          else{
            this.HandleMessage(true, MessageType.Sucess, 'Approve Failed');

          }
          
       
        console.log(res)
      },
      err => {          
         this.HandleMessage(true, MessageType.Error, 'Error from server side');

      }
    );
  }
 private HandleMessage(show: boolean, type: MessageType = null, message: string = null) {
    this.showMsg = new ShowMessage();
    this.showMsg.Show = show;
    this.showMsg.Type = type;
    this.showMsg.Message = message;
  
    if (show) {
      setTimeout(() => {
        this.showMsg.Show = false;
      }, 6000); // auto-close after 4 sec
    }
  }
  downloadSample() {
      const link = document.createElement('a');
      link.href = 'assets/document/BulkUpload.xlsx';   // relative path to your assets folder
      link.download = 'Sample.xlsx';      // suggested filename
      link.click();
    }
  getAlertIcon(type: MessageType): string {
    switch (type) {
      case MessageType.Sucess:
        return '✅';
      case MessageType.Warning:
        return '⚠️';
      case MessageType.Info:
        return 'ℹ️';
      case MessageType.Error:
        return '❌';
      default:
        return '🔔';
    }
  }
    getAlertClass(type: MessageType): string {
    switch (type) {
      case MessageType.Sucess:
        return 'alert-success';
      case MessageType.Warning:
        return 'alert-warning';
      case MessageType.Info:
        return 'alert-info';
      case MessageType.Error:
        return 'alert-danger';
      default:
        return 'alert-info';
    }
  }

}
