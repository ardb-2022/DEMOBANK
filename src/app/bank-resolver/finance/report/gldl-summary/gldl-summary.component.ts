import { ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { SystemValues, p_report_param, mm_customer, mm_operation } from 'src/app/bank-resolver/Models';
import { tt_trial_balance } from 'src/app/bank-resolver/Models/tt_trial_balance';
import { RestService } from 'src/app/_service';
import { PageChangedEvent } from "ngx-bootstrap/pagination/public_api";
import { ExportAsService, ExportAsConfig } from 'ngx-export-as';
import { MatTableDataSource } from '@angular/material/table';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import { CommonServiceService } from 'src/app/bank-resolver/common-service.service';
import { mm_activity } from 'src/app/bank-resolver/Models/loan/mm_activity';
@Component({
  selector: 'app-gldl-summary',
  templateUrl: './gldl-summary.component.html',
  styleUrls: ['./gldl-summary.component.css']
})
export class DLGLSummary implements OnInit {

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('content', { static: true }) content: TemplateRef<any>;
  // displayedColumns: string[] = ['activity'];
  // displayedColumns: string[] = ['SLNO','party_name','block','application_dt','sanction_dt','sanction_amt','own_contribution','disb_amt','disb_dt','project_cost','net_income','land_area','cul_area','v_h','bond'];
  // ,'loan_id','cust_name','curr_prn_recov', 'ovd_prn_recov','adv_prn_recov','curr_intt_recov','ovd_intt_recov','penal_intt_recov','recov_amt','last_intt_calc_dt'
  dataSource = new MatTableDataSource()
  modalRef: BsModalRef;
  isOpenFromDp = false;
  isOpenToDp = false;
  sys = new SystemValues();
  config = {
    keyboard: false, // ensure esc press doesnt close the modal
    backdrop: true, // enable backdrop shaded color
    ignoreBackdropClick: true // disable backdrop click to close the modal
  };
  notvalidate:boolean=false;
  date_msg:any;
  trailbalance: tt_trial_balance[] = [];
  prp = new p_report_param();
  reportcriteria: FormGroup;
  showReport = false;
  showAlert = false;
  isLoading = false;
  counter=0
  alertMsg = '';
  fd: any;
  td: any;
  dt: any;
  fromdate: Date;
  toDate: Date;
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
  totSanAmt=0
  totDisAmt=0
  totovdPrnSum=0
  totcurrPrnSum=0
  totPrn=0;
  totpenalInttSum=0;
  totadvPrnSum=0;
  loanNm:any;
  male:any;
  activityList: mm_activity[] = [];
  female:any;
  suggestedCustomer: mm_customer[];
  AcctTypes:  mm_operation[];
  filteredArray:any=[]
  resultLength=0;
  LandingCall:boolean;
  filterData:any[]=[];
  ardbcd:any;
  toppings = new FormControl(['']);
  toppingList: string[] = [];
  constructor(private comSer:CommonServiceService, private svc: RestService, private formBuilder: FormBuilder,private exportAsService: ExportAsService, private cd: ChangeDetectorRef,private modalService: BsModalService, private _domSanitizer: DomSanitizer,private router: Router) { }
  ngOnInit(): void {
    this.ardbcd=this.sys.ardbCD
    // // this.getActivityList()
    // this.dataSource.paginator = this.paginator;
    // this.dataSource.sort = this.sort;
    this.fromdate = this.sys.CurrentDate;
    // this.toDate = this.sys.CurrentDate;
    this.reportcriteria = this.formBuilder.group({
      fromDate: [null, Validators.required],
      // toDate: [null, Validators.required],
      // activity_cd: [null, Validators.required],
      // sex: [null, Validators.required],
      // acc_type_cd: [null, Validators.required]
    });
    if(this.comSer.loanRec){
      this.LandingCall=true;
      this.SubmitReport();
    }
    else{
      this.LandingCall=false;
      this.onLoadScreen(this.content);
    }
    var date = new Date();
    var n = date.toDateString();
    var time = date.toLocaleTimeString();
    this.today= n + " "+ time
  }
  getActivityList() {

    if (this.activityList.length > 0) {
      return;
    }
    this.activityList = [];

    this.svc.addUpdDel<any>('Mst/GetActivityMaster', null).subscribe(
      res => {

        this.activityList = res;
        this.activityList = this.activityList.sort((a, b) => (a.activity_desc > b.activity_desc) ? 1 : -1);
        debugger
      },
      err => {

      }
    );

  }
  onLoadScreen(content) {
    this.notvalidate=false
    this.modalRef = this.modalService.show(content, this.config);
  }
 
  setPage(page: number) {
    this.currentPage = page;
    this.cd.detectChanges();
  }
  pageChanged(event: PageChangedEvent): void {
    const startItem = (event.page - 1) * event.itemsPerPage;
    const endItem = event.page * event.itemsPerPage;
    this.pagedItems = this.reportData.slice(startItem, endItem); 
    console.log(this.pagedItems)
    this.cd.detectChanges();
  }
  getTotalAccounts() {
  return this.filterData.reduce((sum, item) => sum + item.total_no_acc, 0);
}

getTotalGL() {
  return this.filterData.reduce((sum, item) => sum + item.gl_balance, 0);
}

getTotalDL() {
  return this.filterData.reduce((sum, item) => sum + item.dl_balance, 0);
}
prepareData() {
  this.isLoading=true;
  const deposits = this.filterData.filter(x => x.acc_type_cd < 20000);
  const loans = this.filterData.filter(x => x.acc_type_cd > 20000);

  // Deposit totals
  const depositTotal = {
    brn_cd: deposits.length ? deposits[0].brn_cd : '',
    acc_type_cd: 19999,
    acc_type_desc: 'DEPOSIT TOTAL',
    total_no_acc: deposits.reduce((sum, item) => sum + item.total_no_acc, 0),
    gl_balance: deposits.reduce((sum, item) => sum + item.gl_balance, 0),
    dl_balance: deposits.reduce((sum, item) => sum + item.dl_balance, 0),
    difference: deposits.reduce((sum, item) => sum + item.difference, 0)
  };

  // Loan totals
  const loanTotal = {
    brn_cd: loans.length ? loans[0].brn_cd : '',
    acc_type_cd: 99999,
    acc_type_desc: 'LOAN TOTAL',
    total_no_acc: loans.reduce((sum, item) => sum + item.total_no_acc, 0),
    gl_balance: loans.reduce((sum, item) => sum + item.gl_balance, 0),
    dl_balance: loans.reduce((sum, item) => sum + item.dl_balance, 0),
    difference: loans.reduce((sum, item) => sum + item.difference, 0)
  };

  // Merge deposits + deposit total + loans + loan total
  this.filterData = [
    ...deposits,
    depositTotal,
    ...loans,
    loanTotal
  ];
  this.isLoading=false
}
getTotalDiff() {

  return this.filterData.reduce((sum, item) => sum + item.difference, 0);
}
  public SubmitReport() {
  this.isLoading=true;
  this.modalRef.hide();
  this.filterData=[]
      var dt={
        "ardb_cd":this.sys.ardbCD,
        "adt_temp_dt":this.reportcriteria.controls.fromDate.value.toISOString()
      }
      this.svc.addUpdDel<any>('Finance/GetDepositLoanSummary',dt).subscribe(data=>{console.log(data)
        const allData=data;
        this.filterData=allData.data;
        if(!this.filterData){
          this.comSer.SnackBar_Nodata()
          this.isLoading=false
        } else{
          this.prepareData();
          this.isLoading=false
        }
         
        
        
      
       
      }),
      err => {
         this.isLoading = false;
         this.comSer.SnackBar_Error(); 
        }
      
  }
  getUniqueArray(array: string[]): string[] {
    return array.filter((value, index, self) => self.indexOf(value) === index);
  }
  hideSactionDt(){
    this.reportData=this.filterDcStatements(this.reportData,this.toppings.value)
    this.dataSource.data=this.reportData;
  }
  filterDcStatements(data: any[], datesToRemove: string[]): any[] {
    debugger
    return data.map(activity => ({
      ...activity,
      dclist: activity.dclist
        .map(dcItem => ({
          ...dcItem,
          dc_statement: dcItem.dc_statement.filter(
            statement => !datesToRemove.includes(statement.sanction_dt.split(' ')[0])
          )
        }))
        .filter(dcItem => dcItem.dc_statement.length > 0)
    })).filter(activity => activity.dclist.length > 0);
  }
  public oniframeLoad(): void {
    this.counter++;
    if(this.counter==2){
      this.isLoading = false;
      this.counter=0
    }
    else{
      this.isLoading=true;
    }
    this.modalRef.hide();
  }
  public closeAlert() {
    this.showAlert = false;
  }
  closeScreen() {
    this.router.navigate([this.sys.BankName + '/la']);
  }
  applyFilter(event: Event) {
    console.log(event)
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
    // this.getTotal()
  }
 downloadexcel() {
  this.exportAsConfig = {
    type: 'xlsx',
    elementIdOrContent: 'mattable',
    options: {
      sheetName: 'GLDL'   // <= 31 chars, no special characters
    }
  };

  this.exportAsService.save(this.exportAsConfig, 'GLDL_Summary').subscribe(() => {
    console.log("Excel downloaded");
  });
}

}
