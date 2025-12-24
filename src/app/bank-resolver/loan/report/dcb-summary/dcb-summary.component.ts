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
  selector: 'app-dcb-summary',
  templateUrl: './dcb-summary.component.html',
  styleUrls: ['./dcb-summary.component.css'],
  providers:[ExportAsService]
})
export class DcbSummaryComponent implements OnInit {
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
    "default_days", "npa_status", "first_disb_dt", "last_disb_dt",
    "periodicity", "instl_no", "instl_start_dt","sanc_amt","total_disb_amt",
    "acc_type_cd", "acc_num", "cust_name","sl_no",'dds_acc_num'
  ];

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
  displayColumns: string[] = [];     // final columns used by template (includes 'label' as first)
  dataBranches: any[] = [];         // processed branch tables
  numericColumns: string[] = [];    // columns that should be right-aligned and formatted
  grandTotalRow: any = null;

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
      
      this.reportData.length=0;
      this.pagedItems.length=0;
      this.isLoading=true;
     
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
        
          if (!this.reportData || this.reportData.length === 0) { return; }
            this.buildTables();
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
    this.exportAsService.save(this.exportAsConfig, 'DCB').subscribe(() => {
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

  private getAgentName(agent_cd: string) {
    return (this.agentMaster.find(a => a.agent_cd === agent_cd)?.agent_name) || "NO AGENT";
  }
  private getBranchName(brn_cd: string) {
    return (this.branchMaster.find(b => b.brn_cd === brn_cd)?.brn_name) || brn_cd;
  }

  private buildTables() {
    // Clean data (remove excluded fields)
    const cleaned = this.reportData.map(r => this.removeExcludedFields(r));

    // columns (preserve order from first cleaned item)
    const columns = Object.keys(cleaned[0]);

    // numeric columns detection (based on first record)
    this.numericColumns = columns.filter(k => typeof cleaned[0][k] === 'number');

    // We'll add a 'label' column at first position to host "Agent Total / Branch Total" text
    this.displayColumns = ['label', ...columns];

    // Group by branch
    const branchGroups = cleaned.reduce((acc: any, r: any) => {
      const br = r.brn_cd;
      if (!acc[br]) acc[br] = [];
      acc[br].push(r);
      return acc;
    }, {});

    // prepare grand totals initial
    const grandTotals: any = {};
    columns.forEach(c => grandTotals[c] = (this.numericColumns.includes(c) ? 0 : '') );
    grandTotals['label'] = 'GRAND TOTAL';

    // count loans globally
    let grandLoanCount = 0;

    this.dataBranches = [];

    for (const brn_cd of Object.keys(branchGroups)) {
      const branchLoans = branchGroups[brn_cd];
      const brName = this.getBranchName(brn_cd);

      // Group by agent inside branch
      const agentGroups = branchLoans.reduce((acc: any, r: any) => {
        const a = r.agent_cd;
        if (!acc[a]) acc[a] = [];
        acc[a].push(r);
        return acc;
      }, {});

      // track branch totals
      const branchTotals: any = {};
      columns.forEach(c => branchTotals[c] = (this.numericColumns.includes(c) ? 0 : '') );
      // branchTotals['label'] = `Branch Total`;
      branchTotals['label'] = `Total for - ${this.getBranchName(brn_cd)}`;

      let branchLoanCount = 0;

      // Build per-agent data
      const agents: any[] = [];
      for (const agent_cd of Object.keys(agentGroups)) {
        const loans = agentGroups[agent_cd];
        branchLoanCount += loans.length;
        grandLoanCount += loans.length;

        // agent totals
        const agentTotals: any = {};
        columns.forEach(c => agentTotals[c] = (this.numericColumns.includes(c) ? 0 : '') );
        // agentTotals['label'] = 'Agent Wise Total';
        agentTotals['label'] = ` ${this.getAgentName(agent_cd)} (Loans: ${loans.length})`;

        // accumulate loan rows and agent totals
        const loanRows = loans.map(l => {
          // ensure we return consistent keys (columns)
          const row: any = {};
          columns.forEach(c => row[c] = l[c]);
          row['label'] = ''; // blank for normal loan rows
          // add to agent totals
          this.numericColumns.forEach(nc => {
            const v = row[nc];
            agentTotals[nc] += (typeof v === 'number' ? v : 0);
          });
          return row;
        });

        // add agent totals -> also add to branch totals
        this.numericColumns.forEach(nc => {
          branchTotals[nc] += agentTotals[nc];
        });

        agents.push({
          agent_cd,
          agent_name: this.getAgentName(agent_cd),
          loans: loanRows,
          agentTotals
        });
      } // end agent loop

      // accumulate branchTotals into grandTotals
      this.numericColumns.forEach(nc => {
        grandTotals[nc] += branchTotals[nc];
      });

      // store branch for template
      this.dataBranches.push({
        brn_cd,
        brn_name: brName,
        columns,            // original column key order used to build rows
        agents,
        branchTotals,
        branchLoanCount
      });
    } // end branch loop

    // finalize grand total row
    this.grandTotalRow = grandTotals;
    this.grandTotalRow['label'] = `GRAND TOTAL (Loans: ${grandLoanCount})`;
  }

  // helper used by template to decide formatting
  isNumericColumn(colKey: string) {
    // colKey might be 'label' or column names
    return this.numericColumns.includes(colKey);
  }

  // friendly header label
  headerLabel(colKey: string) {
    if (colKey === 'label') return '';
    return colKey.replace(/_/g, ' ').toUpperCase();
  }
}
