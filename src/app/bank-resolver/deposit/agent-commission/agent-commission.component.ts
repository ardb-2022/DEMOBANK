import { ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { SystemValues, p_report_param, mm_customer } from 'src/app/bank-resolver/Models';
import { tt_trial_balance } from 'src/app/bank-resolver/Models/tt_trial_balance';
import { RestService } from 'src/app/_service';
import { PageChangedEvent } from "ngx-bootstrap/pagination/public_api";
import { ExportAsService, ExportAsConfig } from 'ngx-export-as'
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import { CommonServiceService } from 'src/app/bank-resolver/common-service.service';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
@Component({
  selector: 'app-agent-commission',
  templateUrl: './agent-commission.component.html',
  styleUrls: ['./agent-commission.component.css'],
  providers:[ExportAsService]
})
export class AgentCommissionComponent implements OnInit {
  @ViewChild('content', { static: true }) content: TemplateRef<any>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  dataSource = new MatTableDataSource()
  displayedColumns: string[] = ['brnCd','agentCd','agentName', 'ddsColl', 'loanColl', 'totalColl', 'ddsCommission', 'loanCommission'];
  notvalidate:boolean=false;
  date_msg:any;
  modalRef: BsModalRef;
  isOpenFromDp = false;
  isOpenToDp = false;
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
  showAlert2 = false;
  isLoading = false;
  ReportUrl: SafeResourceUrl;
  UrlString = '';
  alertMsg = '';
  fd: any;
  td: any;
  dt: any;
  fromdate: Date;
  toDate: Date;
  counter=0
  afterPost:boolean=false;
  suggestedCustomer: mm_customer[];
  exportAsConfig:ExportAsConfig;
  itemsPerPage = 50;
  currentPage = 1;
  pagedItems = [];
  reportData:any=[]
  ardbName=localStorage.getItem('ardb_name')
  branchName=this.sys.BranchName
  response:any;
  pageChange: any;
  total_comm=0;
  total_dep=0;
  apiurl:any;
  lastAccCD:any;
  today:any
  
  filteredArray:any=[];

  dataArray:any[] = [];
  branchMaster:any[] = [];

  groupedData: any[] = [];
  grandTotal: any = {};

  constructor(private svc: RestService, private formBuilder: FormBuilder,
    private modalService: BsModalService, private _domSanitizer: DomSanitizer,private exportAsService: ExportAsService, private cd: ChangeDetectorRef,
    private router: Router, private comSer:CommonServiceService) { }
  ngOnInit(): void {
    this.GetBranchMaster();
    this.fromdate = this.sys.CurrentDate;
    this.toDate = this.sys.CurrentDate;
    this.reportcriteria = this.formBuilder.group({
      fromDate: [null, Validators.required],
      toDate: [null, Validators.required]
    });
  
    var date = new Date();
    // get the date as a string
       var n = date.toDateString();
    // get the time as a string
       var time = date.toLocaleTimeString();
       this.today= n + " "+ time
       this.onLoadScreen(this.content);
  }
  onLoadScreen(content) {
    this.notvalidate=false
    this.modalRef = this.modalService.show(content, this.config);
  }
  isRetrieve(){
    this.onLoadScreen(this.content);
  }
  
  setPage(page: number) {
    this.currentPage = page;
    this.cd.detectChanges();
  }
  public SubmitReport() {
    this.comSer.getDay(this.reportcriteria.controls.fromDate.value,this.reportcriteria.controls.toDate.value)
    if (this.reportcriteria.invalid) {
      this.showAlert = true;
      this.alertMsg = 'Invalid Input.';
      return false;
    }
    else if(this.comSer.diff<0){
      this.date_msg= this.comSer.date_msg
      this.notvalidate=true
    }
    else {
      this.total_dep=0;
      this.total_comm=0;
      this.fromdate = this.reportcriteria.controls.fromDate.value;
      this.toDate = this.reportcriteria.controls.toDate.value;
      this.reportData.length=0;
      this.pagedItems.length=0;
      this.modalRef.hide();
      this.isLoading=true;
      var dt={
      "brn_cd": this.sys.BranchCode,
       "ardb_cd": this.sys.ardbCD,
       "from_dt" : this.fromdate.toISOString(),
       "to_dt" : this.toDate.toISOString()
      }
      
      this.svc.addUpdDel<any>('Deposit/GetAgentCommission',dt).subscribe(data=>{console.log(data)
       this.dataArray=data;
        if(!this.dataArray){
          debugger
          this.comSer.SnackBar_Nodata()
            this.isLoading=false
        } 
        else{
          debugger
             this.prepareReport();
              this.isLoading=false;
                this.modalRef.hide();
        }
       },
        err => {
           this.isLoading = false;
           this.comSer.SnackBar_Error(); 
          })
        this.showAlert = false;
    }
  }
GetBranchMaster()
  {
    this.isLoading=true;
    ;
    this.svc.addUpdDel<any>('Mst/GetBranchMaster', {"ardb_cd":'1'}).subscribe(
      res => {
        console.log(res);
        
        this.branchMaster=res;
        this.isLoading=false;

      },
      err => {this.isLoading=false;}
    )
  }
     prepareReport() {
    // Group data by branch
    const branchMap = new Map<string, any>();

    this.dataArray.forEach(item => {
      if (!branchMap.has(item.brnCd)) {
        const branchInfo = this.branchMaster.find(b => b.brn_cd == item.brnCd);
        branchMap.set(item.brnCd, {
          brnCd: item.brnCd,
          brnName: branchInfo ? branchInfo.brn_name : item.brnCd,
          agents: [],
          totals: {
            ddsColl: 0, loanColl: 0, totalColl: 0,
            ddsCommission: 0, incentive: 0, loanCommission: 0,
            totalCommission: 0, tds:0,security:0, finalCommission:0
          }
        });
      }
      const branch = branchMap.get(item.brnCd);

      branch.agents.push(item);

      // accumulate branch totals
      branch.totals.ddsColl += item.ddsColl;
      branch.totals.loanColl += item.loanColl;
      branch.totals.totalColl += item.totalColl;
      branch.totals.ddsCommission += item.ddsCommission;
      branch.totals.incentive += item.incentive;
      branch.totals.loanCommission += item.loanCommission;
      branch.totals.totalCommission += item.totalCommission;
      branch.totals.tds += item.tds;     
      branch.totals.security += item.security;
      branch.totals.finalCommission += item.finalCommission;
    });

    this.groupedData = Array.from(branchMap.values());

    // Grand Total
    this.grandTotal = {
      ddsColl: 0, loanColl: 0, totalColl: 0,
      ddsCommission: 0, incentive: 0, loanCommission: 0,
      totalCommission: 0, tds:0,security:0, finalCommission:0
    };

    this.groupedData.forEach(branch => {
      this.grandTotal.ddsColl += branch.totals.ddsColl;
      this.grandTotal.loanColl += branch.totals.loanColl;
      this.grandTotal.totalColl += branch.totals.totalColl;
      this.grandTotal.ddsCommission += branch.totals.ddsCommission;
      this.grandTotal.incentive += branch.totals.incentive;
      this.grandTotal.loanCommission += branch.totals.loanCommission;
      this.grandTotal.totalCommission += branch.totals.totalCommission;
      this.grandTotal.tds += branch.totals.tds;
      this.grandTotal.security += branch.totals.security;
      this.grandTotal.finalCommission += branch.totals.finalCommission;
    });
    console.log(this.groupedData);
    
  }
   exportToExcel(): void {
    // Step 1: Convert JSON to worksheet
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.dataArray);

    // Step 2: Create workbook and append worksheet
    const workbook: XLSX.WorkBook = {
      Sheets: { 'CommissionReport': worksheet },
      SheetNames: ['CommissionReport']
    };

    // Step 3: Generate Excel buffer
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    // Step 4: Save to file
    const data: Blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, 'CommissionReport.xlsx');
  }

  public closeAlert() {
    this.showAlert = false;
    this.showAlert2 = false;
  }
 
  downloadexcel(){
    this.exportAsConfig = {
      type: 'csv',
      // elementId: 'hiddenTab', 
      elementIdOrContent:'hiddenTab'
    }
    this.exportAsService.save(this.exportAsConfig, 'cashcumtrial').subscribe(() => {
      // save started
      console.log("hello")
    });
  }
  
  closeScreen() {
    this.router.navigate([this.sys.BankName + '/la']);
  }
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
  
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
    this.getTotal()
  }
  getTotal(){
    this.total_dep=0;
    
    console.log(this.dataSource.filteredData)
    this.filteredArray=this.dataSource.filteredData
    for(let i=0;i<this.filteredArray.length;i++){
      this.total_dep+=this.filteredArray[i].deposited_amt;
      this.total_comm+=this.filteredArray[i].commission;

    }
  }
  
  Delete(){

  }
  PostIntt(){
    this.isLoading=true;
    var dt={
      "ardb_cd": this.sys.ardbCD,
      "brn_cd": this.sys.BranchCode,
      "adt_trans_dt":this.sys.CurrentDate.toISOString(),
      "gs_user_id": this.sys.UserId
     }
     debugger
     this.svc.addUpdDel('Deposit/PostAgentCommission',dt).subscribe(res=>{console.log(res)
      this.response=res
       if(this.response==0){
        debugger
        this.isLoading=false
        this.showAlert2 = true
        this.afterPost=true;
        this.alertMsg = 'Commission Posting in Agent Account Successfully';
      }
      else{
        this.afterPost=false;
        this.showAlert = true
        this.alertMsg = 'Occurred in Commission Posting';
      }
       
       },
       err => {
          this.afterPost=false;
          this.isLoading = false;
          this.comSer.SnackBar_Error(); 
         })
       
  }

}
