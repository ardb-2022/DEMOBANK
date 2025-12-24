import { ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild,AfterViewInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { SystemValues, p_report_param, mm_customer } from 'src/app/bank-resolver/Models';
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
  selector: 'app-open-closing-register',
  templateUrl: './open-closing-register.component.html',
  styleUrls: ['./open-closing-register.component.css'],
  providers:[ExportAsService]

})
export class OpenClosingRegisterComponent implements OnInit ,AfterViewInit{
  @ViewChild('content', { static: true }) content: TemplateRef<any>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  dataSource = new MatTableDataSource()
  displayedColumns: string[] = ['SLNO','brn_cd','acc_type_cd', 'acc_num','cust_cd','phone', 'cust_name','cust_address', 'prn_amt','intt_amt','intt_rt','opn_cls_dt'];

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
  closeResult = '';
  showReport = false;
  showAlert = false;
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
  exportAsConfig:ExportAsConfig;
  itemsPerPage = 50;
  currentPage = 1;
  pagedItems = [];
  reportData:any=[]
  ardbName=localStorage.getItem('ardb_name')
  branchName=this.sys.BranchName
  sumPrn=0
  sumIntt=0
  pageChange: any;
  opdrSum=0;
  opcrSum=0;
  drSum=0;
  crSum=0;
  clsdrSum=0;
  clscrSum=0;
  lastAccCD:any;
  today:any
  showWait=false;
  LandingOpenCall:boolean;
  LandingCloseCall:boolean;
  suggestedCustomer: mm_customer[];
  filteredArray:any=[];
  allAgent:any[]=[];
  accountTypeList:any[]=[];
  filteredData: any[] = [];
  branchData:any[]=[];
  accTypes: string[] = [];
  agents: string[] = [];
  branchs:string[]=[];
  selectedAccType: string = '';
  selectedAgent: string = '';
  selectedBranch:string = '';
  constructor(private svc: RestService, private formBuilder: FormBuilder,
    private modalService: BsModalService, private _domSanitizer: DomSanitizer,private exportAsService: ExportAsService, private cd: ChangeDetectorRef,
    private router: Router, private comSer:CommonServiceService) { }
  ngOnInit(): void {
    this.getBranchList();
    this.getAccountTypeList();
    this.LandingOpenCall=false;
    this.LandingCloseCall=false;
    if(this.comSer.accOpen){
      this.LandingOpenCall=true;
    }
    if(this.comSer.accClose){
      this.LandingCloseCall=true;
    }
    this.fromdate = this.sys.CurrentDate;
    this.toDate = this.sys.CurrentDate;
    this.reportcriteria = this.formBuilder.group({
      fromDate: [null, Validators.required],
      toDate: [null, Validators.required],
      OpenClose: [null, Validators.required]
    });
    if(this.LandingOpenCall||this.LandingCloseCall){
      if(this.LandingOpenCall){
        this.reportcriteria.controls.OpenClose.setValue('O')
        this.reportcriteria.controls.toDate.setValue(this.sys.CurrentDate)
        this.reportcriteria.controls.fromDate.setValue(this.sys.CurrentDate)
      }
      else{
        this.reportcriteria.controls.OpenClose.setValue('C')
        this.reportcriteria.controls.toDate.setValue(this.sys.CurrentDate)
        this.reportcriteria.controls.fromDate.setValue(this.sys.CurrentDate)
      }
      debugger
      this.SubmitReport();
    }
    else{
      this.onLoadScreen(this.content);
    }
    
    var date = new Date();
    // get the date as a string
       var n = date.toDateString();
    // get the time as a string
       var time = date.toLocaleTimeString();
       this.today= n + " "+ time
  }
  onLoadScreen(content) {
    this.notvalidate=false
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
  getBranchName(brn_cd: string): string {
  const branch = this.branchData.find(b => b.brn_cd === brn_cd);
  return branch ? branch.brn_name : brn_cd;
}
 getAccountTypeList() {
   
    this.accountTypeList = [];

    this.svc.addUpdDel<any>('Mst/GetAccountTypeMaster', null).subscribe(
      res => {
        this.accountTypeList = res;
        this.accountTypeList = this.accountTypeList.filter(c => c.dep_loan_flag === 'D');
        this.accountTypeList = this.accountTypeList.sort((a, b) => (a.acc_type_cd > b.acc_type_cd) ? 1 : -1);
       
       
      });
  }
  public SubmitReport() {
    this.comSer.getDay(this.reportcriteria.controls.fromDate.value,this.reportcriteria.controls.toDate.value)
    if(this.LandingOpenCall||this.LandingCloseCall){
      this.sumPrn=0;
      this.sumIntt=0
      this.reportData.length=0;
      this.pagedItems.length=0;
      this.isLoading=true
      this.fromdate = this.reportcriteria.controls.fromDate.value;
      this.toDate = this.reportcriteria.controls.toDate.value;
      var dt={
        "ardb_cd": this.sys.ardbCD,
        "from_dt": this.fromdate.toISOString(),
        "to_dt":this.toDate.toISOString(),
        "brn_cd":this.sys.BranchCode,
        "flag":this.reportcriteria.controls.OpenClose.value
        
      }
      this.svc.addUpdDel<any>('Deposit/PopulateOpenCloseRegister',dt).subscribe(data=>{console.log(data)
        this.reportData=data;
        this.dataSource.data=this.reportData
        if(!this.reportData){
          this.comSer.SnackBar_Nodata()
          this.isLoading=false
        } 
        else{
         this.accTypes = Array.from(
            new Set(this.reportData.map(d => d.acc_type_desc as string))
          );
           this.agents = Array.from(
            new Set(this.reportData.map(d => d.agent_cd as string).filter(a => !!a))
          );
           this.branchs = Array.from(
            new Set(this.reportData.map(d => d.brn_cd as string).filter(a => !!a))
          );
          this.filteredData = [...this.reportData];
         this.reportData.forEach(e=>{
            this.sumPrn+=e.prn_amt;
            this.sumIntt+=e.intt_amt;
          })

        
        
        }
        this.isLoading=false
        },
        err => {
           this.isLoading = false;
           this.comSer.SnackBar_Error(); 
          })
        this.showAlert = false;
    }
    else{
      if (this.reportcriteria.invalid) {
        debugger
        this.showAlert = true;
        this.alertMsg = 'Invalid Input.';
        return false;
      }
      else if(this.comSer.diff<0){
        debugger
        this.date_msg= this.comSer.date_msg
        this.notvalidate=true
      }

  else {
    this.sumPrn=0;
    this.sumIntt=0
    this.reportData.length=0
    this.modalRef.hide();
    this.reportData.length=0;
    this.pagedItems.length=0;
    this.isLoading=true
    this.fromdate = this.reportcriteria.controls.fromDate.value;
    this.toDate = this.reportcriteria.controls.toDate.value;
    var dt={
      "ardb_cd": this.sys.ardbCD,
      "from_dt": this.fromdate.toISOString(),
      "to_dt":this.toDate.toISOString(),
      "brn_cd":this.sys.BranchCode=='100'?'%':this.sys.BranchCode,
      "flag":this.reportcriteria.controls.OpenClose.value
      
    }
    this.svc.addUpdDel('Deposit/PopulateOpenCloseRegister',dt).subscribe(data=>{console.log(data)
      this.reportData=data;
      
      
      this.modalRef.hide();
      if(!this.reportData){
        this.comSer.SnackBar_Nodata()
          this.isLoading=false;
          this.dataSource.data=[]
      } 
      else {
           // Format date safely
            for (let i = 0; i < this.reportData.length; i++) {
              if (this.reportData[i].opn_cls_dt) {
                this.reportData[i].opn_cls_dt = this.comSer.getFormatedDate(this.reportData[i].opn_cls_dt);
              }
            }

            this.isLoading = false;

            // Collect unique account types
            this.accTypes = Array.from(
              new Set(this.reportData.map(d => d.acc_type_desc).filter(a => !!a))
            );

            // Collect unique agents (ignore null/empty)
            this.agents = Array.from(
              new Set(this.reportData.map(d => d.agent_cd).filter(a => !!a))
            );

            // Collect unique branches (ignore null/empty)
            this.branchs = Array.from(
              new Set(this.reportData.map(d => d.brn_cd).filter(a => !!a))
            );

            // Preserve original data
            this.filteredData = [...this.reportData];

            // Reset sums before calculating
            this.sumPrn = 0;
            this.sumIntt = 0;
            this.reportData.forEach(e => {
              this.sumPrn += Number(e.prn_amt) || 0;
              this.sumIntt += Number(e.intt_amt) || 0;
            });

            // Assign to dataSource
            this.dataSource.data = this.reportData;
          }

      },
      err => {
         this.isLoading = false;
         this.comSer.SnackBar_Error(); 
        })
      this.showAlert = false;
    // this.showAlert = false;
    // this.fromdate = this.reportcriteria.controls.fromDate.value;
    // this.toDate = this.reportcriteria.controls.toDate.value;
    // this.UrlString = this.svc.getReportUrl();
    // this.UrlString = this.UrlString + 'WebForm/Deposit/opencloseregister?'
    //   + 'ardb_cd='+this.sys.ardbCD
    //   + '&from_dt=' + Utils.convertDtToString(this.fromdate)
    //   + '&to_dt=' + Utils.convertDtToString(this.toDate)
    //   + '&brn_cd=' + this.sys.BranchCode
    //   + '&flag=' + this.reportcriteria.controls.OpenClose.value; // todo opn/close    O / C.

    // this.isLoading = true;
    // this.ReportUrl = this._domSanitizer.bypassSecurityTrustResourceUrl(this.UrlString);
    // this.modalRef.hide();
    // setTimeout(() => {
    //   this.isLoading = false;
    // }, 10000);
  }
    }
        
  }
  public oniframeLoad(): void {
    this.counter++
    if(this.counter==2){
      this.isLoading=false;
      this.counter=0
    }
    else{
      this.isLoading = true;

    }
    this.modalRef.hide();
  }
  public closeAlert() {
    this.showAlert = false;
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
    this.exportAsService.save(this.exportAsConfig, 'OpenClose_Register').subscribe(() => {
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

 applyFilter() {
    this.filteredData = this.reportData.filter(item => {
      const accMatch = this.selectedAccType ? item.acc_type_desc === this.selectedAccType : true;
      const agentMatch = this.selectedAgent ? item.agent_cd === this.selectedAgent : true;
      const brnMatch = this.selectedBranch ? item.brn_cd === this.selectedBranch : true;
      return accMatch && agentMatch && brnMatch;
    });
    this.sumPrn = 0;
    this.sumIntt = 0;
    this.filteredData.forEach(e => {
    this.sumPrn += e.prn_amt;
    this.sumIntt += e.intt_amt;
  });
    this.dataSource.data= this.filteredData;
  }

  clearFilter() {
    this.selectedAccType = '';
    this.selectedAgent = '';
    this.selectedBranch = '';
    this.filteredData = [...this.reportData];
    this.dataSource.data= this.reportData;
  }
  getTotal(){
    this.sumPrn=0
    this.sumIntt=0
    console.log(this.dataSource.filteredData);
    
    this.filteredArray=this.dataSource.filteredData
    for(let i=0;i<this.filteredArray.length;i++){
      this.sumPrn+=this.filteredArray[i].prn_amt;
      this.sumIntt+=this.filteredArray[i].intt_amt
      console.log(this.filteredArray[i]);
    
      // this.crSum+=this.filteredArray[i].cr_amount
    }
    
    
  }
}
