import { ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { SystemValues, mm_customer, p_report_param, mm_operation } from 'src/app/bank-resolver/Models';
import { p_gen_param } from 'src/app/bank-resolver/Models/p_gen_param';
import { tt_trial_balance } from 'src/app/bank-resolver/Models/tt_trial_balance';
import { RestService } from 'src/app/_service';
import Utils from 'src/app/_utility/utils';
import { PageChangedEvent } from "ngx-bootstrap/pagination/public_api";
import { ExportAsService, ExportAsConfig } from 'ngx-export-as'
import { MatTableDataSource } from '@angular/material/table';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import { CommonServiceService } from 'src/app/bank-resolver/common-service.service';
@Component({
  selector: 'app-npa-summary',
  templateUrl: './npa-summary.component.html',
  styleUrls: ['./npa-summary.component.css'],
  providers:[ExportAsService]
})
export class NpaSummaryComponent implements OnInit {
  public static operations: mm_operation[] = [];
  @ViewChild('content', { static: true }) content: TemplateRef<any>;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  modalRef: BsModalRef;
  isOpenFromDp = false;
  isOpenFromDp1 = false;
  isOpenToDp = false;
  sys = new SystemValues();
  config = {
    keyboard: false, // ensure esc press doesnt close the modal
    backdrop: true, // enable backdrop shaded color
    ignoreBackdropClick: true // disable backdrop click to close the modal
  };
  trailbalance: tt_trial_balance[] = [];
  resultLength=0
  filteredArray:any=[]
  modelDate = '';
  AcctTypes:any[]=[];
  prp = new p_report_param();
  reportcriteria: FormGroup;
  closeResult = '';
  showReport = false;
  showAlert = false;
  isLoading = true;
  ReportUrl: SafeResourceUrl;
  UrlString = '';
  alertMsg = '';
  counter=0;
  fd: any;
  td: any;
  dt: any;
  fromdate: Date;
  todate: Date;
  exportAsConfig:ExportAsConfig;
  itemsPerPage = 50;
  currentPage = 1;
  pagedItems = [];
  reportData:any=[]
  ardbName=localStorage.getItem('ardb_name')
  branchName=this.sys.BranchName
  monthYear:any=''
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

  bName=''
  selectedValue=''
  selectedValue1=''
  firstGroup:any=[]
  secondGroup:any=[]

  loanNm:any;
  inputEl:any
  bName1='';
  summaryData:any[]=[];
  filteredArray1:any=[]
          TOTsanc_amt=0;
          TOTprev_outstanding=0;
          TOTtotal_disb_amt=0;
          DMYsanc_amt=0;
          DMYprev_outstanding=0;
          DMYtotal_disb_amt=0;
          TOTovd_demand=0;
          DMYovd_demand
          TOTcurr_prn_demand=0;
          DMYcurr_prn_demand=0;
          TOTcurr_intt_demand=0;
          DMYcurr_intt_demand=0;
          TOTtotal_demand=0;
          DMYtotal_demand=0;
          TOTadditional_disb=0;
          DMYadditional_disb  =0;        
          TOTovd_recov=0;
          DMYovd_recov=0;
          TOTcurr_recov=0;
          DMYcurr_recov=0;
          TOTadv_recov=0;
          DMYadv_recov=0;
          TOTintt_recov=0;
          DMYintt_recov=0;
          TOTtotal_recovery=0;
          DMYtotal_recovery=0;
          TOToutstanding=0;
          DMYoutstanding=0;
          TOTovd_balance=0;
          DMYovd_balance=0;
          TOTstock_security_outstanding=0;
          TOTcollateral_security_outstanding=0;
          DMYstock_security_outstanding=0;
          DMYcollateral_security_outstanding=0;
          TOTdeposit_outstanding=0;
          DMYdeposit_outstanding=0;
  selectItems=[
    
    {
      value:'Branch Name',
      name:'Branch Name'
    },
    {
      value:'Account Type',
      name:'Account Type'
    },
    {
      value:'Agent Name',
      name:'Agent Name'
    },
    {
      value:'NPA Status',
      name:'NPA Status'
    }
    
  ]
  selectItems1=[
    {
      value:'Branch Name',
      name:'Branch Name'
    },
    {
      value:'Account Type',
      name:'Account Type'
    },
    {
      value:'Agent Name',
      name:'Agent Name'
    },
    {
      value:'NPA Status',
      name:'NPA Status'
    }
    
  ];
  branchData:any[]=[];
  allAgent:any[]=[];
  // displayedColumns: string[] = ['block_name','acc_name','party_name', 'acc_num', 'list_dt', 'substan_prn_rate','stan_prn_rate','d1_prn','d2_prn','plus','substan_prn','stan_prn','computed_till_dt'];
  displayedColumns: string[] = ['sl_no','brn_cd','agent_cd','acc_type_cd', 'acc_num', 
    'cust_name','sanc_amt','total_disb_amt','first_disb_dt','last_disb_dt','periodicity',
    'instl_no','instl_start_dt','prev_outstanding','ovd_demand','curr_prn_demand',
    'curr_intt_demand','total_demand','additional_disb','ovd_recov','curr_recov','adv_recov',
    'intt_recov','total_recovery','outstanding','ovd_balance','default_days','npa_status',
    'stock_security_outstanding','collateral_security_outstanding','deposit_outstanding'];
  dataSource = new MatTableDataSource()
  searchfilter= new MatTableDataSource()
  constructor(private svc: RestService, private formBuilder: FormBuilder,
    private modalService: BsModalService, private _domSanitizer: DomSanitizer,private exportAsService: ExportAsService, private cd: ChangeDetectorRef,
    private router: Router, private comSer:CommonServiceService) { }
  ngOnInit(): void {
    this.getAgentList();
    this.getBranchList();
    this.getAccountTypeList();
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.fromdate = this.sys.CurrentDate;
    this.todate = this.sys.CurrentDate;
    this.reportcriteria = this.formBuilder.group({
      fromDate: [null, Validators.required]
    });
    // this.getOperationMaster();
    this.onLoadScreen(this.content);
    var date = new Date();
    var n = date.toDateString();
    var time = date.toLocaleTimeString();
    this.today= n + " "+ time
    this.isLoading=false

  } 
   getPeriodicity(prd: any): string {
  let prdcty = '';
  switch (prd) {
    case 'M':
      prdcty = 'Monthly';
      break;
    case 'Y':
      prdcty = 'Yearly';
      break;
    case 'H':
      prdcty = 'Half-Yearly';
      break;
    case 'Q':
      prdcty = 'Quarterly';
      break;
    case '':
      prdcty = 'Unknown';
      break;
    default:
      prdcty = 'Unknown';
      break;
  }
  return prdcty;
}

    getMonthAndYear(dt:Date){
      const firstDate = dt;
      const monthYear = firstDate.toLocaleString("en-US", { month: "long", year: "numeric" });
      console.log(monthYear);
      return monthYear
    }
  onOpenCalendar(container) {
    container.monthSelectHandler = (event: any): void => {
      container._store.dispatch(container._actions.select(event.date));
    };     
    container.setViewMode('month');
  }
  getAccountTypeList() {

    if (this.AcctTypes.length > 0) {
      return;
    }
    this.AcctTypes = [];

    this.isLoading = true;
    this.svc.addUpdDel<any>('Mst/GetAccountTypeMaster', null).subscribe(
      res => {

        this.isLoading = false;
        this.AcctTypes = res;
        this.AcctTypes = this.AcctTypes.filter(c => c.dep_loan_flag === 'L');
        this.AcctTypes = this.AcctTypes.sort((a, b) => (a.acc_type_cd > b.acc_type_cd) ? 1 : -1);
      },
      err => {
        this.isLoading = false;
      }
    );
  }
 onLoadScreen(content) {
  
    this.modalRef = this.modalService.show(content, this.config);
  }
  setPage(page: number) {
    this.currentPage = page;
    this.cd.detectChanges();
  }
  
getBranchList(){
    this.branchData = [];
    this.isLoading = true;
    this.svc.addUpdDel<any>('Mst/GetBranchMaster', {"ardb_cd":"1"}).subscribe(
      res => {

        this.isLoading = false;
        this.branchData = res;
      },
      err => {
        this.isLoading = false;
      }
    );
  }
   getAgentList() {
    var dt = {
      "ardb_cd": this.sys.ardbCD,
      "brn_cd": '%'
    }
    this.svc.addUpdDel<any>('Deposit/GetAgentData', dt).subscribe(res => {
      this.allAgent=res
    })
  }
  getSummary(data: any[]) {
  const grouped: any[] = [];

  this.branchData.forEach(branch => {
    const branchData = data.filter(d => d.brn_cd === branch.brn_cd);
    if (branchData.length > 0) {
      const branchSummary: any = {
        brn_cd: branch.brn_cd,
        brn_name: branch.brn_name,
        agents: [],
        totals: this.calcTotals(branchData)   // branch total
      };

      this.allAgent.forEach(agent => {
        const agentData = branchData.filter(d => d.agent_cd === agent.agent_cd);
        if (agentData.length > 0) {
          branchSummary.agents.push({
            agent_cd: agent.agent_cd,
            agent_name: agent.agent_name,
            totals: this.calcTotals(agentData)  // agent total
          });
        }
      });

      grouped.push(branchSummary);
    }
  });

  return grouped;
}

// Helper to calculate totals
calcTotals(rows: any[]) {
  return {
    sanc_amt: rows.reduce((sum, r) => sum + r.sanc_amt, 0),
    total_disb_amt: rows.reduce((sum, r) => sum + r.total_disb_amt, 0),
    total_demand: rows.reduce((sum, r) => sum + r.total_demand, 0),
    total_recovery: rows.reduce((sum, r) => sum + r.total_recovery, 0),
    outstanding: rows.reduce((sum, r) => sum + r.outstanding, 0),
    deposit_outstanding: rows.reduce((sum, r) => sum + r.deposit_outstanding, 0)
  };
}
    createDateFrmMonth(dt:Date){
      const firstDate = dt;

      // Get year & month
      const year = firstDate.getFullYear();
      const month = firstDate.getMonth(); // 0 = Jan, 8 = Sep

      // Last date of the month → create date of next month 0th day
      const lastDate = new Date(year, month + 1, 0);
      return lastDate?lastDate:new Date;
    }
    public SubmitReport() {
      if (!this.modelDate) {
        this.showAlert = true;
        this.alertMsg = 'Invalid Input.';
        return false;
      }
      else {
      console.log(this.modelDate);
      this.monthYear=this.getMonthAndYear(new Date(this.modelDate));
      this.todate=this.createDateFrmMonth(new Date(this.modelDate));
      console.log(this.todate);
      
      this.modalRef.hide();
      this.summaryData=[];
      this.reportData.length=0;
      this.pagedItems.length=0;
      this.isLoading=true;
      this.TOTsanc_amt=0
      this.TOTtotal_disb_amt=0
      this.TOTprev_outstanding=0;
          this.DMYprev_outstanding=0;
          this.TOTovd_demand=0;
          this.DMYovd_demand=0;
          this.TOTcurr_prn_demand=0;
          this.DMYcurr_prn_demand=0;
          this.TOTcurr_intt_demand=0;
          this.DMYcurr_intt_demand=0;
          this.TOTtotal_demand=0;
          this.DMYtotal_demand=0;
          this.TOTadditional_disb=0;
         this. DMYadditional_disb  =0;        
          this.TOTovd_recov=0;
          this.DMYovd_recov=0;
          this.TOTcurr_recov=0;
          this.DMYcurr_recov=0;
          this.TOTadv_recov=0;
          this.DMYadv_recov=0;
          this.TOTintt_recov=0;
          this.DMYintt_recov=0;
          this.TOTtotal_recovery=0;
          this.DMYtotal_recovery=0;
          this.TOToutstanding=0;
          this.DMYoutstanding=0;
          this.TOTovd_balance=0;
          this.DMYovd_balance=0;
          this.TOTstock_security_outstanding=0;
          this.DMYstock_security_outstanding=0;
          this.TOTcollateral_security_outstanding=0;
          this.DMYcollateral_security_outstanding=0;
          this.TOTdeposit_outstanding=0;
          this.DMYdeposit_outstanding=0;
      // this.loanNm=this.AcctTypes.filter(e=>e.acc_type_cd==this.reportcriteria.controls.acc_type_cd.value)[0].acc_type_desc
      // console.log(this.loanNm)
      this.fromdate = new Date(this.modelDate)
      var dt={
        "ardb_cd":this.sys.ardbCD,
        "brn_cd":this.sys.BranchCode,
        "from_dt":this.fromdate.toISOString(),
        "to_dt":this.todate.toISOString()
      }
      this.svc.addUpdDel<any>('Loan/GetDcbRep',dt).subscribe(data=>{console.log(data)
        const allData=data;
        this.reportData=allData.data;
        // this.itemsPerPage=this.reportData.length % 50 <=0 ? this.reportData.length: this.reportData.length % 50
        this.isLoading=false
        // if(this.reportData.length<50){
        //   this.pagedItems=this.reportData
        // }
        if(allData.status=='"Failure' ||allData.statusCode=='-1'){
          this.comSer.SnackBar_Nodata()
          this.isLoading=false
        } 
        else{
       debugger
          console.log(this.getSummary(this.reportData));
         this.summaryData= this.getSummary(this.reportData)
        this.reportData.forEach(e => {
          e.first_disb_dt=this.comSer.getFormatedDate(e.first_disb_dt);
          e.last_disb_dt=this.comSer.getFormatedDate(e.last_disb_dt);
          e.instl_start_dt=this.comSer.getFormatedDate(e.instl_start_dt);
          e.acc_type_desc=this.AcctTypes.filter(a=>a.acc_type_cd==e.acc_type_cd)[0]?.acc_type_desc;
          e.brn_name=this.branchData.filter(a=>a.brn_cd==e.brn_cd)[0]?.brn_name;
          e.agent_name=this.allAgent.filter(a=>a.agent_cd==e.agent_cd)[0]?.agent_name;
          this.TOTsanc_amt+=e.sanc_amt;
          this.TOTtotal_disb_amt+=e.total_disb_amt;
          this.TOTprev_outstanding+=e.prev_outstanding;
          this.TOTovd_demand+=e.ovd_demand;
          this.TOTcurr_prn_demand+=e.curr_prn_demand;
          this.TOTcurr_intt_demand+=e.curr_intt_demand;
          this.TOTtotal_demand+=e.total_demand;
          this.TOTadditional_disb+=e.additional_disb ;         
          this.TOTovd_recov+=e.ovd_recov;
          this.TOTcurr_recov+=e.curr_recov;
          this.TOTadv_recov+=e.adv_recov;
          this.TOTintt_recov+=e.intt_recov;
          this.TOTtotal_recovery+=e.total_recovery;
          this.TOToutstanding+=e.outstanding;
          this.TOTovd_balance+=e.ovd_balance;
          this.TOTstock_security_outstanding+=e.stock_security_outstanding;
          this.TOTcollateral_security_outstanding+=e.collateral_security_outstanding;
          this.TOTdeposit_outstanding+=e.deposit_outstanding;


          this.DMYsanc_amt+=e.sanc_amt;
          this.DMYtotal_disb_amt+=e.total_disb_amt;
          this.DMYprev_outstanding+=e.prev_outstanding;
          this.DMYovd_demand+=e.ovd_demand;
          this.DMYcurr_prn_demand+=e.curr_prn_demand;
          this.DMYcurr_intt_demand+=e.curr_intt_demand;
          this.DMYtotal_demand+=e.total_demand;
          this.DMYadditional_disb+=e.additional_disb  ;        
          this.DMYovd_recov+=e.ovd_recov;
          this.DMYcurr_recov+=e.curr_recov;
          this.DMYadv_recov+=e.adv_recov;
          this.DMYintt_recov+=e.intt_recov;
          this.DMYtotal_recovery+=e.total_recovery;
          this.DMYoutstanding+=e.outstanding;
          this.DMYovd_balance+=e.ovd_balance;
          this.DMYstock_security_outstanding+=e.stock_security_outstanding;
          this.DMYcollateral_security_outstanding+=e.collateral_security_outstanding;
          this.DMYdeposit_outstanding+=e.deposit_outstanding;
        });
        if(this.reportData?.length>0){
        this.dataSource.data=this.reportData;
        console.log(this.reportData);
        
        }
        
      }
      },err => {
        this.isLoading = false;
        this.comSer.SnackBar_Error(); 
       })
    }
  }
  // public oniframeLoad(): void {
  //   this.counter++;
  //   this.isLoading = true;
  //   if(this.counter==2){
  //     this.isLoading=false;
  //     this.counter=0;
  //   this.modalRef.hide();
  // }}
  public closeAlert() {
    this.showAlert = false;
  }
  takeLoanVal(e:any){
    console.log(e)
  }
  pageChanged(event: PageChangedEvent): void {
    const startItem = (event.page - 1) * event.itemsPerPage;
    const endItem = event.page * event.itemsPerPage;
    this.pagedItems = this.reportData.slice(startItem, endItem); //Retrieve items for page
    console.log(this.pagedItems)
  
    this.cd.detectChanges();
  }
  downloadexcel(){
    this.exportAsConfig = {
      type: 'xlsx',
      // elementId: 'hiddenTab', 
      elementIdOrContent:'mattable'
    }
    this.exportAsService.save(this.exportAsConfig, 'DCB').subscribe(() => {
      // save started
      console.log("hello")
    });
  }
  closeScreen() {
    this.router.navigate([this.sys.BankName + '/la']);
  }
  applyFilter0(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    this.searchfilter.data=this.dataSource.filteredData
    console.log(this.dataSource)
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
    this.getTotal()
  }
  // applyFilter1(event: Event) {
  //   const filterValue = (event.target as HTMLInputElement).value;
  //   this.searchfilter.filter = filterValue.trim().toLowerCase();
  //   this.dataSource.data=this.searchfilter.filteredData
  //   if (this.dataSource.paginator) {
  //     this.dataSource.paginator.firstPage();
  //   }
  //   this.getTotal()
  // }
  applyFilter(event:Event){
    const filterValue=(event.target as HTMLInputElement).value
    this.bName=(event.target as HTMLInputElement).value
    this.filteredArray=this.dataSource.data
    // this.filteredArray=this.filteredArray.filter(e=>e.block_name.toLowerCase().includes(filterValue.toLowerCase())==true)
    switch(this.selectedValue1){
      case "Branch Name": 
      this.filteredArray=this.reportData.filter(e=>e.brn_name?.toLowerCase().includes(filterValue.toLowerCase())==true)
        break;
        case "Account Type": 
    this.filteredArray=this.reportData.filter(e=>e.acc_type_desc?.toLowerCase().includes(filterValue.toLowerCase())==true)
      break;
      case "Agent Name": 
    this.filteredArray=this.reportData.filter(e=>e.agent_name?.toLowerCase().includes(filterValue.toLowerCase())==true)
      break;
      case "NPA Status": 
      this.filteredArray=this.reportData.filter(e=>e.npa_status?.toString().includes(filterValue)==true)
        break;
    //   case "Party Name":
    // this.filteredArray=this.reportData.filter(e=>e.party_name?.toLowerCase().includes(filterValue.toLowerCase())==true)
    //  break;
    //  case "Issue DT":
    //   this.filteredArray=this.reportData.filter(e=>e.list_dt?.toString().includes(filterValue)==true)
    //    break;
    //    case "Loan ID":
    //     this.filteredArray=this.reportData.filter(e=>e.acc_num?.toLowerCase().includes(filterValue.toLowerCase())==true)
    //      break;

    }
    this.dataSource.data=this.filteredArray
    this.getTotal()
    // this.filteredArray.forEach(e=>
    //   {
    //    if(e.block_name.includes(filterValue))
    // this.dataSource.data=this.filteredArray
    // console.log(this.dataSource.data)

      
    //   })
  }
  showFirstGroup(){
    this.dataSource.data=this.reportData
    this.bName=''
    this.bName1=''
    this.selectedValue=''
    this.firstGroup.length=0
    switch(this.selectedValue1){
     case "Branch Name": 
      for(let i=0;i<this.reportData.length;i++){
        this.firstGroup[i]=this.reportData[i].brn_name
     }
      //  console.log(this.blockNames)
     
        break;
      case "Account Type": 
      for(let i=0;i<this.reportData.length;i++){
        this.firstGroup[i]=this.reportData[i].acc_type_desc
     }
     break;
      case "Agent Name": 
      for(let i=0;i<this.reportData.length;i++){
        this.firstGroup[i]=this.reportData[i].agent_name
     }
    // this.filteredArray=this.reportData.filter(e=>e.activity_cd?.toLowerCase().includes(filterValue.toLowerCase())==true)
      break;
      case "NPA Status":
        for(let i=0;i<this.reportData.length;i++){
          this.firstGroup[i]=this.reportData[i].npa_status
       }
    

    }
    this.firstGroup=Array.from(new Set(this.firstGroup))
    this.firstGroup=this.firstGroup.sort()
  }
  searchFirstGroup(){
    this.isLoading=true
    // this.bName=''
    this.bName1=''
    this.selectedValue=''
    setTimeout(()=>{this.isLoading=false},500)
    switch(this.selectedValue1){
      case "Branch Name": 
      this.filteredArray=this.reportData.filter(e=>e.brn_name?.toLowerCase().includes(this.bName.toLowerCase())==true)
        break;
      case "Account Type": 
    this.filteredArray=this.reportData.filter(e=>e.acc_type_desc?.toLowerCase().includes(this.bName.toLowerCase())==true)
      break;
      case "Agent Name": 
    this.filteredArray=this.reportData.filter(e=>e.agent_name?.toLowerCase().includes(this.bName.toLowerCase())==true)
      break;
      case "NPA Status":
    this.filteredArray=this.reportData.filter(e=>e.npa_status?.toLowerCase().includes(this.bName.toLowerCase())==true)
     break;
     

    }
    this.dataSource.data=this.filteredArray
    this.filteredArray1=this.filteredArray
    this.getTotal()
  }
  showSecondGroup(){
    this.dataSource.data=this.filteredArray1
    this.secondGroup.length=0;
    this.bName1=''
    switch(this.selectedValue){
       case "Branch Name": 
      for(let i=0;i<this.filteredArray1.length;i++){
        this.secondGroup[i]=this.filteredArray1[i].brn_name
     }
      //  console.log(this.blockNames)
     
        break;
      case "Account Type": 
      for(let i=0;i<this.filteredArray1.length;i++){
        this.secondGroup[i]=this.filteredArray1[i].acc_type_desc
     }
     break;
     case "Agent Name": 
     for(let i=0;i<this.filteredArray1.length;i++){
       this.secondGroup[i]=this.filteredArray1[i].agent_name
    }
    // this.filteredArray=this.reportData.filter(e=>e.activity_cd?.toLowerCase().includes(filterValue.toLowerCase())==true)
      break;
      case "NPA Status":
        for(let i=0;i<this.filteredArray1.length;i++){
          this.secondGroup[i]=this.filteredArray1[i].npa_status
       }
    // this.filteredArray=this.reportData.filter(e=>e.party_name?.toLowerCase().includes(filterValue.toLowerCase())==true)
     break;
     

    }
    this.secondGroup=Array.from(new Set(this.secondGroup))
    this.secondGroup=this.secondGroup.sort()
    this.getTotal()
  }
  searchSecondGroup(){
    this.isLoading=true
    setTimeout(()=>{this.isLoading=false},500)
    console.log(this.filteredArray1)

debugger
    switch(this.selectedValue){
      case "Branch Name": 
      this.filteredArray=this.filteredArray1.filter(e=>e.brn_name?.toLowerCase().includes(this.bName1.toLowerCase())==true)
        break;
        case "Account Type": 
    this.filteredArray=this.filteredArray1.filter(e=>e.acc_type_desc?.toLowerCase().includes(this.bName1.toLowerCase())==true)
      break;
      case "Agent Name": 
    this.filteredArray=this.filteredArray1.filter(e=>e.agent_name?.toLowerCase().includes(this.bName1.toLowerCase())==true)
      break;
      case "NPA Status":
    this.filteredArray=this.filteredArray1.filter(e=>e.npa_status?.toLowerCase().includes(this.bName1.toLowerCase())==true)
     break;
     

    }
    debugger;
    console.log(this.filteredArray1)
    this.dataSource.data=this.filteredArray
    this.getTotal()
  }

  
  applyFilter1(event:Event){
    const filterValue=(event.target as HTMLInputElement).value
    this.filteredArray=this.dataSource.data
    switch(this.selectedValue){
      case "Branch Name": 
    this.filteredArray=this.filteredArray.filter(e=>e.brn_name?.toLowerCase().includes(filterValue.toLowerCase())==true)
      break;
      case "Account Type": 
    this.filteredArray=this.filteredArray.filter(e=>e.acc_type_desc?.toLowerCase().includes(filterValue.toLowerCase())==true)
      break;
      case "Agent Name": 
      this.filteredArray=this.filteredArray.filter(e=>e.agent_name?.toString().includes(filterValue)==true)
        break;
      case "NPA Status":
    this.filteredArray=this.filteredArray.filter(e=>e.npa_status?.toLowerCase().includes(filterValue.toLowerCase())==true)
     break;

    }
    this.dataSource.data=this.filteredArray

    this.getTotal()
  }
  getTotal(){
          this.TOTsanc_amt=0
          this.TOTtotal_disb_amt=0
          this.TOTprev_outstanding=0
          this.TOTovd_demand=0
          this.TOTcurr_prn_demand=0
          this.TOTcurr_intt_demand=0
          this.TOTtotal_demand=0
          this.TOTadditional_disb=0         
          this.TOTovd_recov=0
          this.TOTcurr_recov=0
          this.TOTadv_recov=0
          this.TOTintt_recov=0
          this.TOTtotal_recovery=0
          this.TOToutstanding=0
          this.TOTovd_balance=0
          this.TOTstock_security_outstanding=0;
          this.DMYstock_security_outstanding=0;
          this.TOTcollateral_security_outstanding=0;
          this.DMYcollateral_security_outstanding=0;
          this.TOTdeposit_outstanding=0

    
    console.log(this.dataSource.filteredData)
    this.filteredArray=this.dataSource.filteredData
    this.filteredArray.forEach(e => {
          this.TOTsanc_amt+=e.sanc_amt
          this.TOTtotal_disb_amt+=e.total_disb_amt
          this.TOTprev_outstanding+=e.prev_outstanding
          this.TOTovd_demand+=e.ovd_demand
          this.TOTcurr_prn_demand+=e.curr_prn_demand
          this.TOTcurr_intt_demand+=e.curr_intt_demand
          this.TOTtotal_demand+=e.total_demand
          this.TOTadditional_disb+=e.additional_disb          
          this.TOTovd_recov+=e.ovd_recov
          this.TOTcurr_recov+=e.curr_recov
          this.TOTadv_recov+=e.adv_recov
          this.TOTintt_recov+=e.intt_recov
          this.TOTtotal_recovery+=e.total_recovery
          this.TOToutstanding+=e.outstanding
          this.TOTovd_balance+=e.ovd_balance
          this.TOTstock_security_outstanding+=e.stock_security_outstanding;
          this.TOTcollateral_security_outstanding+=e.collateral_security_outstanding;
          this.TOTdeposit_outstanding+=e.deposit_outstanding

    });
  }
  resetList(){
    this.isLoading=true
    setTimeout(()=>{this.isLoading=false},500)
    this.dataSource.data=this.reportData;
    // this.SubmitReport()
    this.inputEl=document.getElementById('myInput');
    this.inputEl.value=''
    // this.inputEl=document.getElementById('myInput2');
    // this.inputEl.value=''
    // this.inputEl=document.getElementById('myInput1');
    this.inputEl.value='';
          this.TOTsanc_amt=this.DMYsanc_amt
          this.TOTtotal_disb_amt=this.DMYtotal_disb_amt
          this.TOTprev_outstanding=this.DMYprev_outstanding
          this.TOTovd_demand=this.DMYovd_demand
          this.TOTcurr_prn_demand=this.DMYcurr_prn_demand
          this.TOTcurr_intt_demand=this.DMYcurr_intt_demand
          this.TOTtotal_demand=this.DMYtotal_demand
          this.TOTadditional_disb=this.DMYadditional_disb          
          this.TOTovd_recov=this.DMYovd_recov
          this.TOTcurr_recov=this.DMYcurr_recov
          this.TOTadv_recov=this.DMYadv_recov
          this.TOTintt_recov=this.DMYintt_recov
          this.TOTtotal_recovery=this.DMYtotal_recovery
          this.TOToutstanding=this.DMYoutstanding
          this.TOTovd_balance=this.DMYovd_balance
          this.TOTstock_security_outstanding+=this.DMYstock_security_outstanding;
          this.TOTcollateral_security_outstanding+=this.DMYcollateral_security_outstanding;
          this.TOTdeposit_outstanding=this.DMYdeposit_outstanding
   this.selectedValue='';
   this.selectedValue1='';
   this.bName=''
   this.bName1=''
    
    
  }
}
