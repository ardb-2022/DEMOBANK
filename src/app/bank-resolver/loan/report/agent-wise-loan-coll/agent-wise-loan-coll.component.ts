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
  selector: 'app-agent-wise-loan-coll',
  templateUrl: './agent-wise-loan-coll.component.html',
  styleUrls: ['./agent-wise-loan-coll.component.css']
})
export class AgentWiseLoanCollComponent implements OnInit {
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
  ardbName=localStorage.getItem('ardb_name')
  branchName=this.sys.BranchName

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

  showMonthEnd=false;
  totOutstanding=0
  totCurrPrn=0
  totOvdPrn=0
  totOvdIntt=0
  allAgent:any[]=[];
  accountTypeList:any[]=[];
  filteredArray:any=[];
  selectedAgent:any='';
  showHideAgent:boolean=false;
  constructor(private svc: RestService, private formBuilder: FormBuilder,private exportAsService: ExportAsService, private cd: ChangeDetectorRef,
    private modalService: BsModalService, private _domSanitizer: DomSanitizer,
    private router: Router) { }
  ngOnInit(): void {
    this.getAccountTypeList();
    this.getAgentList();
    this.fromdate = this.sys.CurrentDate;
    this.toDate = this.sys.CurrentDate;
    this.reportcriteria = this.formBuilder.group({
      fromDate: [null, Validators.required],
      toDate: [null, Validators.required],
      agent_cd: [null, Validators.required]
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
 
    getAccountTypeList() {
    if (this.accountTypeList.length > 0) {
      return;
    }
    this.accountTypeList = [];

    this.svc.addUpdDel<any>('Mst/GetAccountTypeMaster', null).subscribe(
      res => {

        this.accountTypeList = res;
       this.accountTypeList = this.accountTypeList.filter(c => c.dep_loan_flag === 'L');
        this.accountTypeList = this.accountTypeList.sort((a, b) => (a.acc_type_cd > b.acc_type_cd) ? 1 : -1);
       
       
      });
  }
  getLoanTypeName(acc_cd: number): string {
  const loan = this.accountTypeList.find(l => l.acc_type_cd === acc_cd);
  return loan ? loan.acc_type_desc : acc_cd.toString();
}

   getAgentList() {
    var dt = {
      "ardb_cd": this.sys.ardbCD,
      "brn_cd": '%'
    }
    this.svc.addUpdDel<any>('Deposit/GetAgentData', dt).subscribe(res => {
      this.allAgent=res;
    })
  }
  selectAgent(agent:any){
    this.reportcriteria.controls.agent_cd.setValue(agent.agent_cd);
    this.selectedAgent=agent.agent_name;
    this.showHideAgent=false
    debugger;
    // this.retrieveData();
  }
  onshow(i:any)
  {
    if(i.target.value==''){
      this.showHideAgent=false
    }
    else{
      this.allAgent=this.allAgent.filter(e=>e.agent_name.toLowerCase().includes(i.target.value.toLowerCase()) || e.agent_cd.includes(i.target.value.toLowerCase()) ==true)
      this.showHideAgent=true
    }
    debugger
  }
  public SubmitReport() {
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
        "agent_cd": this.reportcriteria.controls.agent_cd.value,
        "from_dt": this.fromdate,
        "to_dt": this.toDate
      }
      this.isLoading=true
      this.showAlert = false;
      
      this.svc.addUpdDel('Loan/GetAgentCollReport',dt).subscribe(data=>{console.log(data)
        this.reportData=data;
        this.isLoading=false;
        this.reportData.forEach(e => {
          this.totOutstanding+=e.outstanding;
          this.totCurrPrn+=e.curr_prn;
          this.totOvdPrn+=e.ovd_prn;
          this.totOvdIntt+=e.ovd_intt;
        });
      })
    
     
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
