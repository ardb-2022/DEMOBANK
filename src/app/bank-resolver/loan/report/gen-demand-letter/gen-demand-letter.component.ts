import { ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { SystemValues, p_report_param, mm_customer, ShowMessage, MessageType } from 'src/app/bank-resolver/Models';
import { p_gen_param } from 'src/app/bank-resolver/Models/p_gen_param';
import { tt_trial_balance } from 'src/app/bank-resolver/Models/tt_trial_balance';
import { RestService } from 'src/app/_service';
import Utils from 'src/app/_utility/utils';
import { PageChangedEvent } from "ngx-bootstrap/pagination/public_api";
import { ExportAsService, ExportAsConfig } from 'ngx-export-as'

@Component({
  selector: 'app-gen-demand-letter',
  templateUrl: './gen-demand-letter.component.html',
  styleUrls: ['./gen-demand-letter.component.css']
})
export class GenDemandLetterComponent implements OnInit {
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
  showMsg: ShowMessage;
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
  reportData:any={}  
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
      // toDate: [null, Validators.required],
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
      // const date = Utils.convertStringToDt(cust.disb_dt);
      // this.fromdate = date
      debugger
      this.fromdate=this.sys.CurrentDate
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
  lockDemandLetter(){
     var dt = {
            "brn_cd": this.reportData.brn_cd,
            "acc_cd": this.reportData.acc_cd,
            "loan_id": this.reportData.loan_id,
            "letter_no": this.reportData.letter_no,
            "letter_dt": this.sys.CurrentDate,
            "outstanding": this.reportData.outstanding,
            "ovd_amt": this.reportData.ovd_amt
        }
     
      this.svc.addUpdDel<any>('Loan/InsertDemandLetter',dt).subscribe(data=>{console.log(data)
        const allData=data;
        if(allData.statusCode==0){
           this.HandleMessage(true, MessageType.Sucess, allData.statusMessage);
          
        }else{
            this.HandleMessage(true, MessageType.Error, 'Letter Can not Store in Database, try again!');

        }
        
      },
     err => {
            this.HandleMessage(true, MessageType.Error, 'Server Side Error, try again Later!');
    
     }
    )
            
        
  }

  getLetter(i:any){
     var dt = {
        "ardb_cd": this.sys.ardbCD,
        "brn_cd": this.sys.BranchCode,
        "loan_id": i
      }
      this.svc.addUpdDel<any>('Loan/GetDemandLetterList',dt).subscribe(data=>{console.log(data)
        const allData=data;
        if(allData){
          this.reportData2 = allData.data
        }else{
          this.reportData2= allData.data
        }
        console.log(this.reportData2);
        
      })
  }
  getNoticeText(): string {
    if (!this.reportData2 || this.reportData2.length === 0) {
      return 'PLEASE TREAT THIS AS FIRST NOTICE';
    } else if (this.reportData2.length === 1 && this.reportData2[0].letter_no === 1) {
      return 'PLEASE TREAT THIS AS SECOND NOTICE';
    } else if (this.reportData2.length >= 2) {
      return 'PLEASE TREAT THIS AS FINAL NOTICE';
    }
    return 'PLEASE TREAT THIS AS NOTICE';
  }
 getPreviousNotices(): string {
    if (!this.reportData2 || this.reportData2.length === 0) {
      return '';
    }
    return this.reportData2
      .map(d => `${d.letter_no==1?'FIRST':'SECOND'} Letter sent at ${d.letter_dt.split(' ')[0]}`)
      .join(' and ');
  }
  public SubmitReport() {
    if (this.reportcriteria.invalid) {
      this.showAlert = true;
      this.alertMsg = 'Invalid Input.';
      return false;
    }

    else {
      this.modalRef.hide();
      this.totDisb=0
      this.totalSum=0
      this.totbal=0
      this.totIntt=0
      this.fromdate = this.reportcriteria.controls.fromDate.value;
      var dt = {
        "ardb_cd": this.sys.ardbCD,
        "brn_cd": this.sys.BranchCode,
        "loan_id": this.reportcriteria.controls.acct_num.value,
        "from_dt": this.fromdate,
        // "to_dt": this.toDate
      }
      this.isLoading=true
      this.showAlert = false;
      
      this.svc.addUpdDel<any>('Loan/PopulateDemandLetter',dt).subscribe(data=>{console.log(data)
        const allData=data;
        this.reportData=allData.data[0];
        if(this.reportData){
         this.getLetter(this.reportcriteria.controls.acct_num.value);
         console.log(this.reportData,this.reportData2);
         debugger
        }
        this.isLoading=false
      
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
      private HandleMessage(show: boolean, type: MessageType = null, message: string = null) {
        this.showMsg = new ShowMessage();
        this.showMsg.Show = show;
        this.showMsg.Type = type;
        this.showMsg.Message = message;

        if (show) {
          setTimeout(() => {
            this.showMsg.Show = false;
          }, 5000); // auto-close after 4 sec
        }
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

}
