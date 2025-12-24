import { ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild,AfterViewInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { SystemValues, p_report_param, mm_customer, mm_operation } from 'src/app/bank-resolver/Models';
import { p_gen_param } from 'src/app/bank-resolver/Models/p_gen_param';
import { tt_trial_balance } from 'src/app/bank-resolver/Models/tt_trial_balance';
import { RestService } from 'src/app/_service';
import Utils from 'src/app/_utility/utils';
import { PageChangedEvent } from "ngx-bootstrap/pagination/public_api";
import { ExportAsService, ExportAsConfig } from 'ngx-export-as'
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import { CommonServiceService } from 'src/app/bank-resolver/common-service.service';
@Component({
  selector: 'app-conso-dtl-lst-all',
  templateUrl: './conso-dtl-lst-all.component.html',
  styleUrls: ['./conso-dtl-lst-all.component.css'],
  providers:[ExportAsService]
})
export class ConsoDtlLstAllComponent implements OnInit {
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
 
  excludeFields = [
    "acc_type_cd"
  ];
selectedAccType:'';
  bName=''
  selectedValue=''
  selectedValue1=''
  firstGroup:any=[]
  secondGroup:any=[]

  loanNm:any;
  inputEl:any
  bName1='';
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
  branchMaster :any[]=[];
  agentMaster :any[]=[];
   // table metadata
   numericColumns:string[] = [];
  displayColumns: string[] = [];
  tableData: any[] = [];
  totals: any = {};
  constitutionMaster :any[]=[];
  selectedBranch: string = 'ALL';
  dataSource = new MatTableDataSource()
  searchfilter= new MatTableDataSource()
  constructor(private svc: RestService, private formBuilder: FormBuilder,
    private modalService: BsModalService, private _domSanitizer: DomSanitizer,private exportAsService: ExportAsService, private cd: ChangeDetectorRef,
    private router: Router, private comSer:CommonServiceService) { }
  ngOnInit(): void {
    this.getAgentList();
    this.getConstitutionList()
    this.getBranchList();
    this.getAccountTypeList();
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.fromdate = this.sys.CurrentDate;
    this.todate = this.sys.CurrentDate;
    this.reportcriteria = this.formBuilder.group({
      fromDate: [null, Validators.required],
      acc_type_cd:[null, Validators.required]
    });
    // this.getOperationMaster();
    this.onLoadScreen(this.content);
    var date = new Date();
    var n = date.toDateString();
    var time = date.toLocaleTimeString();
    this.today= n + " "+ time
    this.isLoading=false

  } 
  formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split(' ')[0].split('/');
  if (parts.length !== 3) return dateStr;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // JS months are 0-based
  const year = parseInt(parts[2], 10);

  const dateObj = new Date(year, month, day);
  // 👇 gives "02 Sep 2025"
  return dateObj.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}
 onBranchChange() {
    this.prepareTable();
  }
   isNumericColumn(col: string): boolean {
    return typeof this.reportData[0][col] === "number";
  }
 
  prepareTable() {
    if (this.reportData.length > 0) {
      // 1️⃣ Get dynamic keys except acc_type_cd
      this.displayColumns = Object.keys(this.reportData[0]).filter(k => k !== 'acc_type_cd' && k !== 'constitution_cd');

      // 2️⃣ Apply branch filter
      let filtered = this.selectedBranch === 'ALL'
        ? this.reportData
        : this.reportData.filter(r => r.brn_cd === this.selectedBranch);

      // 3️⃣ Replace codes with names & format dates
      this.tableData = filtered.map((row) => {
        return {
          ...row,
          brn_cd: this.branchMaster.find(b => b.brn_cd === row.brn_cd)?.brn_name || row.brn_cd,
          constitution_cd: this.constitutionMaster.find(c => c.constitution_cd === row.constitution_cd)?.constitution_desc || row.constitution_cd,
          agent_cd: this.agentMaster.find(a => a.agent_cd === row.agent_cd)?.agent_name || row.agent_cd,
          opening_dt: this.comSer.getFormatedDate(row.opening_dt),
          mat_dt: this.comSer.getFormatedDate(row.mat_dt)
        };
      });

      // 4️⃣ Calculate totals for numeric fields
      this.totals = {};
      this.displayColumns.forEach(col => {
        if (typeof filtered[0][col] === "number") {
          this.totals[col] = filtered.reduce((sum, r) => sum + (r[col] || 0), 0);
        }
      });
    }
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
        this.AcctTypes = this.AcctTypes.filter(c => c.dep_loan_flag === 'D');
        this.AcctTypes = this.AcctTypes.sort((a, b) => (a.acc_type_cd > b.acc_type_cd) ? 1 : -1);
      },
      err => {
        this.isLoading = false;
      }
    );
  }
  getConstitutionList() {

    if (this.constitutionMaster?.length > 0) {
      return;
    }

    this.constitutionMaster = [];
    var dt={
      "ardb_cd":this.sys.ardbCD
    }
    this.svc.addUpdDel<any>('Mst/GetConstitution', dt).subscribe(
      res => {
        // ;
        this.constitutionMaster = res;
      },
      err => { // ;
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
    this.branchMaster  = [];
    this.isLoading = true;
    this.svc.addUpdDel<any>('Mst/GetBranchMaster', {"ardb_cd":"1"}).subscribe(
      res => {

        this.isLoading = false;
        this.branchMaster  = res;
      },
      err => {
        this.isLoading = false;
      }
    );
  }
   getAgentList() {
    var dt = {
      "ardb_cd": this.sys.ardbCD,
      "brn_cd": "%"
    }
    this.svc.addUpdDel<any>('Deposit/GetAgentData', dt).subscribe(res => {
      this.agentMaster =res
    })
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
      if (!this.reportcriteria.valid) {
        this.showAlert = true;
        this.alertMsg = 'Invalid Input.';
        return false;
      }
      else {
      
      this.modalRef.hide();
      
      this.reportData.length=0;
      this.pagedItems.length=0;
      this.isLoading=true;
     
      this.fromdate = new Date(this.reportcriteria.controls.fromDate.value)
      var dt={
        "ardb_cd":this.sys.ardbCD,
        "brn_cd":this.sys.BranchCode,
        "from_dt":this.reportcriteria.controls.fromDate.value.toISOString(),
        "acc_type_cd" : this.reportcriteria.controls.acc_type_cd.value,
      }
      this.svc.addUpdDel<any>('Deposit/GetDepositDLConso',dt).subscribe(data=>{console.log(data)
        const allData=data;
        this.reportData=allData.data;
        // this.itemsPerPage=this.reportData.length % 50 <=0 ? this.reportData.length: this.reportData.length % 50
        this.isLoading=false;
        
        // if(this.reportData.length<50){
        //   this.pagedItems=this.reportData
        // }
        if(allData.status=='"Failure' ||allData.statusCode=='-1'){
          this.comSer.SnackBar_Nodata()
          this.isLoading=false
        } 
        else{
       debugger
        
          if (!this.reportData || this.reportData.length === 0) { return; }
            this.prepareTable();
        // console.log(this.reportData);
        //  this.summaryData= this.groupLoanData(this.reportData)
        
        
        
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
    this.exportAsService.save(this.exportAsConfig, 'Deposit_Dtl_List').subscribe(() => {
      // save started
      console.log("hello")
    });
  }
  closeScreen() {
    this.router.navigate([this.sys.BankName + '/la']);
  }
 

   private removeExcludedFields(obj: any) {
    const clone: any = {};
    for (const key of Object.keys(obj)) {
      if (!this.excludeFields.includes(key)) {
        clone[key] = obj[key];
      }
    }
    return clone;
  }

  getAccountName(acc_type_cd: any) {
    return (this.AcctTypes.find(a => a.acc_type_cd === acc_type_cd)?.acc_type_desc) || "UNKNOWN";
  }
    public onAccountTypeChange(): void {
    this.selectedAccType='';
   
    this.selectedAccType=this.AcctTypes.filter(e=>e.acc_type_cd==this.reportcriteria.controls.acc_type_cd.value)[0]?.acc_type_desc
      console.log(this.selectedAccType);
      
  }

  // friendly header label
  headerLabel(colKey: string) {
    if (colKey === 'label') return '';
    return colKey.replace(/_/g, ' ').toUpperCase();
  }
}
