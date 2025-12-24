import { ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { SystemValues, p_report_param, mm_customer } from 'src/app/bank-resolver/Models';
import { p_gen_param } from 'src/app/bank-resolver/Models/p_gen_param';
import { tt_trial_balance } from 'src/app/bank-resolver/Models/tt_trial_balance';
import { RestService } from 'src/app/_service';
import Utils from 'src/app/_utility/utils';
import { PageChangedEvent } from "ngx-bootstrap/pagination/public_api";
import { ExportAsService, ExportAsConfig } from 'ngx-export-as'

@Component({
  selector: 'app-ad-rec-stmt',
  templateUrl: './ad-rec-stmt.component.html',
  styleUrls: ['./ad-rec-stmt.component.css']
})
export class AdRecStmtComponent implements OnInit {
  @ViewChild('content', { static: true }) content: TemplateRef<any>;
  modalRef: BsModalRef;
  isOpenFromDp = false;
  isOpenToDp = false;
  showWait=false;
   disabledOnNull = true;
  sys = new SystemValues();
  config = {
    keyboard: false, // ensure esc press doesnt close the modal
    backdrop: true, // enable backdrop shaded color
    ignoreBackdropClick: true // disable backdrop click to close the modal
  };
  prnInttHide:boolean=false;
  provisionalHide:boolean=false;
  trailbalance: tt_trial_balance[] = [];
  prp = new p_report_param();
  reportcriteria: FormGroup;
  closeResult = '';
  showReport = false;
  showAlert = false;
  isLoading = false;
  counter=0;
  ReportUrl: SafeResourceUrl;
  UrlString = '';
  alertMsg = '';
  fd: any;
  td: any;
  dt: any;
  fromdate: Date;
  toDate: Date;
  suggestedCustomer: mm_customer[];
  exportAsConfig:ExportAsConfig;
  itemsPerPage = 50;
  currentPage = 1;
  pagedItems = [];
  reportData:any=[]  
  reportData2:any=[]

  ardbName=localStorage.getItem('ardb_name')
  branchName=this.sys.BranchName
provisionalRow:any;
  pageChange: any;
  opdrSum=0;
  opcrSum=0;
  drSum=0;
  crSum=0;
  clsdrSum=0;
  clscrSum=0;
  lastAccCD:any;
  today:any
  cName:any
  cAddress:any
  cAcc:any
  lastAccNum:any
  currInttSum=0
  ovdInttSum=0
  ovdPrnSum=0
  currPrnSum=0
  totPrn=0;
  penalInttSum=0;
  loanNm:any;
  lastLoanID:any
  totalSum=0;
  lastBlock:any;
  lastAct:any
  totIntt=0
  totOut=0
  totDisb=0
  totadvprnrecov=0
  totcurrprnrecov=0
  totovdprnrecov=0
  totrecov=0
  totcurprn=0
  totovdprn=0
  totbal=0
  constructor(private svc: RestService, private formBuilder: FormBuilder,private exportAsService: ExportAsService, private cd: ChangeDetectorRef,
    private modalService: BsModalService, private _domSanitizer: DomSanitizer,
    private router: Router) { }
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
  onLoadScreen(content) {
    this.modalRef = this.modalService.show(content, this.config);
  }
  setPage(page: number) {
    this.currentPage = page;
    this.cd.detectChanges();
  }
  pageChanged(event: PageChangedEvent): void {
    const startItem = (event.page - 1) * event.itemsPerPage;
    const endItem = event.page * event.itemsPerPage;
    this.pagedItems = this.reportData.slice(startItem, endItem); //Retrieve items for page
    // console.log(this.pagedItems)
  
    this.cd.detectChanges();
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
getParticularsText(part: string, transCd: number): string {
  if (!part) return '';

  const [main, mode] = part.split('$');  // split into ["I", "T"]

  let text = '';
  switch (main) {
    case 'B':
      text = transCd >= 100000 ? 'Capitalisation' : 'Disbursement';
      break;
    case 'I':
      text = 'Interest';
      break;
    case 'R':
      text = 'Recovery';
      break;
    case 'P':
      text = 'Provisional Interest';
      break;
    default:
      text = part;
  }

  if (mode) {
    let modeText = '';
    switch (mode) {
      case 'T':
        modeText = 'Transfer';
        break;
      case 'C':
        modeText = 'Cash';
        break;
      case 'Q':
        modeText = 'Cheque';
        break;
      case 'O':
        modeText = 'Online';
        break;
      // add more modes if needed
      default:
        modeText = mode;
    }
    return `${text} / ${modeText}`;
  }

  return text;
}
  showHide(){
    this.prnInttHide=!this.prnInttHide;
  }
  public SubmitReport() {
    if (this.reportcriteria.invalid) {
      this.showAlert = true;
      this.alertMsg = 'Invalid Input.';
      return false;
    }

    else {
      this.modalRef.hide();
      // this.reportData.length=0;
      // this.pagedItems.length=0;
      // this.isLoading=false
      this.totDisb=0
      // this.totcurrprnrecov=0
      // this.totadvprnrecov=0
      // this.totovdprnrecov=0
      // this.totrecov=0
      // this.totcurprn=0
      // this.totovdprn=0
      this.totalSum=0
      this.totbal=0
      this.totIntt=0
      // this.loanNm=this.AcctTypes.filter(e=>e.acc_type_cd==this.reportcriteria.controls.acc_type_cd.value)[0].acc_type_desc
      // console.log(this.loanNm)
      this.fromdate = this.reportcriteria.controls.fromDate.value;
      this.toDate = this.reportcriteria.controls.toDate.value;
      var dt = {
        "ardb_cd": this.sys.ardbCD,
        "brn_cd": this.sys.BranchCode,
        "loan_id": this.reportcriteria.controls.acct_num.value,
        "from_dt": this.fromdate,
        "to_dt": this.toDate
      }
      this.isLoading=true
      this.showAlert = false;
      
      this.svc.addUpdDel('Loan/GetCustTransData',dt).subscribe(data=>{console.log(data)
        this.reportData2=data;
        this.provisionalRow = this.reportData2.find(r => r.particulars === 'P$T');
        this.reportData = this.reportData2.filter(r => r.particulars !== 'P$T');
        // this.itemsPerPage=this.reportData.length % 50 <=0 ? this.reportData.length: this.reportData.length % 50
        this.isLoading=false
        // if(this.reportData.length<50){
        //   this.pagedItems=this.reportData
        // }
        // this.pageChange=document.getElementById('chngPage');
        // this.pageChange.click()
        // this.setPage(2);
        // this.setPage(1)
        // this.modalRef.hide();
        // // this.lastAccNum=this.reportData[this.reportData.length-1].acc_num
        this.reportData.forEach(e => {
          if(e.particulars=='I'){
            this.totIntt+=e.dr_amt;
          }
          this.totDisb+=e.dr_amt
          this.totbal+=e.cr_amt
          // this.totalSum+=e.ovd_intt+e.curr_intt+e.curr_prn+e.ovd_prn
        });
        this.reportData2.forEach(e => {
          this.totalSum+=e.dr_amt
          // this.totalSum+=e.ovd_intt+e.curr_intt+e.curr_prn+e.ovd_prn
        });
        // this.reportData.forEach(e=>{
        //   this.lastAct=e.acc_cd
        // })
      })
    
      // this.UrlString = this.UrlString + 'WebForm/Loan/loandisbursement?'
      //   + 'ardb_cd='+ this.sys.ardbCD
      //   + '&brn_cd=' + this.sys.BranchCode
      //   + '&from_dt=' + Utils.convertDtToString(this.fromdate)
      //   + '&to_dt=' + Utils.convertDtToString(this.toDate);

      // this.isLoading = true;
      // this.ReportUrl = this._domSanitizer.bypassSecurityTrustResourceUrl(this.UrlString);
      // this.modalRef.hide();
      // setTimeout(() => {
      //   this.isLoading = false;
      // }, 10000);
    }
  }
  public oniframeLoad(): void {
    this.counter++
    if(this.counter==2){
      this.isLoading = false;
      this.counter=0
    }
    else{
      this.isLoading=true
    }
    this.modalRef.hide();
  }
  public closeAlert() {
    this.showAlert = false;
  }


  closeScreen() {
    this.router.navigate([this.sys.BankName + '/la']);
  }


}
