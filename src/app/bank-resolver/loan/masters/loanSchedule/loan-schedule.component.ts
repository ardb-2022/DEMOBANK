import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { MessageType, mm_customer, mm_vill, ShowMessage, SystemValues } from 'src/app/bank-resolver/Models';
import { KccDM } from 'src/app/bank-resolver/Models/loan/KccDM';
import { mm_crop } from 'src/app/bank-resolver/Models/loan/mm_crop';
import { mm_kcc_member_dtls } from 'src/app/bank-resolver/Models/loan/mm_kcc_member_dtls';
import { mm_land_register } from 'src/app/bank-resolver/Models/loan/mm_land_register';
import { td_kcc_sanction_dtls } from 'src/app/bank-resolver/Models/loan/td_kcc_sanction_dtls';
import { p_gen_param } from 'src/app/bank-resolver/Models/p_gen_param';
import { RestService } from 'src/app/_service';
import Utils from 'src/app/_utility/utils';

@Component({
  selector: 'app-loan-schedule',
  templateUrl: './loan-schedule.component.html',
  styleUrls: ['./loan-schedule.component.css']
})
export class LoanScheduleComponent implements OnInit {

  constructor(private svc: RestService, private formBuilder: FormBuilder, private modalService: BsModalService,
    private router: Router) { }
     @ViewChild('content', { static: true }) content: TemplateRef<any>;
      modalRef: BsModalRef;
      isOpenFromDp = false;
      isOpenToDp = false;
      showWait=false;
       disabledOnNull = true;
      sys = new SystemValues();
       showAlert = false;
         alertMsg = '';
      config = {
        keyboard: false, // ensure esc press doesnt close the modal
        backdrop: true, // enable backdrop shaded color
        ignoreBackdropClick: true // disable backdrop click to close the modal
      };
  get f() { return this.reportcriteria.controls; }
  reportcriteria: FormGroup;
  branchCode = '0';
  userName = '';
  isLoading = false;
  showMsg: ShowMessage;

suggestedCustomer: mm_customer[];
   totalPrincipal = 0;
  totalInterest = 0;
  totalEmi = 0;
  today:any;
 loanData:any[]=[];
  fromdate: Date;
  toDate: Date;
  ardbName = localStorage.getItem('ardb_name')
  branchName = this.sys.BranchName;
  // tempcustname ='';
  ngOnInit(): void {
    
       this.fromdate = this.sys.CurrentDate;
       this.toDate = this.sys.CurrentDate;
       this.reportcriteria = this.formBuilder.group({
         fromDate: [null, Validators.required],
         toDate: [null, Validators.required],
         acct_num: [null, Validators.required]
       });
       this.onLoadScreen(this.content);
       var date = new Date();
       // get the date as a string
          var n = date.toDateString();
       // get the time as a string
          var time = date.toLocaleTimeString();
          this.today= n + " "+ time
  }
 public closeAlert() {
    this.showAlert = false;
  }
  SubmitReport(){
    if (this.reportcriteria.invalid) {
      this.showAlert = true;
      this.alertMsg = 'Invalid Input.';
      return false;
    }

    else {
      this.modalRef.hide();
      this.fromdate = this.reportcriteria.controls.fromDate.value;
      this.toDate = this.reportcriteria.controls.toDate.value;
      var dt = {
        "ardb_cd": this.sys.ardbCD,
        "brn_cd": this.sys.BranchCode,
        "as_acc_num": this.reportcriteria.controls.acct_num.value
      }
      this.isLoading=true
      this.showAlert = false;
      
      this.svc.addUpdDel<any>('Loan/GetRepaymentSchedule',dt).subscribe(data=>{console.log(data)
        this.loanData=data;
        if(this.loanData){
          this.getTotal();
        }
        // this.itemsPerPage=this.reportData.length % 50 <=0 ? this.reportData.length: this.reportData.length % 50
        this.isLoading=false})
    }
  }
  getTotal(){
    this.totalPrincipal = this.loanData.reduce((sum, row) => sum + row.instl_prn, 0);
    this.totalInterest = this.loanData.reduce((sum, row) => sum + row.instl_intt, 0);
    this.totalEmi = this.loanData.reduce((sum, row) => sum + (row.instl_prn + row.instl_intt), 0);
  }
  closeScreen() { this.router.navigate([this.sys.BankName + '/la']); }
  onLoadScreen(content) {
    this.modalRef = this.modalService.show(content, this.config);
  }
    cancelOnNull() {
      this.suggestedCustomer = null;
      if (this.reportcriteria.controls.acct_num.value.length > 0) {
        this.disabledOnNull = false;
      }
      else {
        this.disabledOnNull = true
      }
    }
    public suggestCustomer(): void {
        // debugger;
        this.showWait=true
        this.isLoading = true;
        if (this.reportcriteria.controls.acct_num.value.length > 0) {
          const prm = new p_gen_param();
          prm.as_cust_name = this.reportcriteria.controls.acct_num.value.toLowerCase();
          prm.ardb_cd = this.sys.ardbCD
          this.svc.addUpdDel<any>('Loan/GetLoanDtlsByID', prm).subscribe(
            res => {
              this.isLoading = false
              console.log(res)
              if (undefined !== res && null !== res && res.length > 0) {
                this.suggestedCustomer = res;
              } else {
                this.isLoading = false
                this.suggestedCustomer = [];
              }
              this.showWait=false;
            },
            err => { this.isLoading = false; }
          );
        } else {
          this.isLoading = false;
          this.suggestedCustomer = null;
        }
      }
    
      public SelectCustomer(cust: any): void {
        debugger;
        console.log(cust)
        const date = Utils.convertStringToDt(cust.disb_dt);
        this.fromdate = date
        debugger
        this.toDate=this.sys.CurrentDate
        this.reportcriteria.controls.acct_num.setValue(cust.loan_id);
        this.suggestedCustomer = null;
        debugger
      }
  private HandleMessage(show: boolean, type: MessageType = null, message: string = null) {
    this.showMsg = new ShowMessage();
    this.showMsg.Show = show;
    this.showMsg.Type = type;
    this.showMsg.Message = message;
  }
}
