import { ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild,AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { SystemValues, mm_customer, p_report_param } from 'src/app/bank-resolver/Models';
import { tt_trial_balance } from 'src/app/bank-resolver/Models/tt_trial_balance';
import { RestService } from 'src/app/_service';
import { ExportAsService, ExportAsConfig } from 'ngx-export-as';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import { CommonServiceService } from 'src/app/bank-resolver/common-service.service';
@Component({
  selector: 'app-user-transaction',
  templateUrl: './user-transaction.component.html',
  styleUrls: ['./user-transaction.component.css'],
  providers:[ExportAsService]

})
export class UserTransactionComponent implements OnInit,AfterViewInit {

  @ViewChild('content', { static: true }) content: TemplateRef<any>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  dataSource = new MatTableDataSource()
  displayedColumns: string[] = ['acc_type_desc'];
  branchMaster: any[] = [];   // branch master array
  filteredData: any[] = [];  
  
  globalSearch: string = '';
  selectedBranch: string = ''; // final displayed data
  // displayedColumns: string[] = ['acc_type_desc', 'constitution_desc', 'prn_intt_flag', 'acc_num','cust_name','cash_dr','trf_dr','cash_cr','trf_cr'];
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
  isLoading = false;
  ReportUrl: SafeResourceUrl;
  UrlString = '';
  alertMsg = '';
  fd: any;
  td: any;
  dt: any;
  fromdate: Date;
  todate: Date;
  counter=0;
  exportAsConfig:ExportAsConfig;
  ardbName=localStorage.getItem('ardb_name')
  branchName=this.sys.BranchName

  firstAccCD:any
  lastAccCD:any;
  crSum=0;
  drSum=0;
  itemsPerPage = 2;
  currentPage = 1;
  pageChange: any;
  pagedItems = [];
  reportData:any=[];
  reportData1:any=[]
  k=0;
  lastcustcd:any
  cashDr=0
  cashCr=0
  trfCr=0
  trfDr=0
  filteredArray:any=[]
  formattedData:any[]=[];
  today = new Date();
  transactionDate: any;
  constructor(private svc: RestService, private formBuilder: FormBuilder,
              private modalService: BsModalService, private _domSanitizer: DomSanitizer, private cd: ChangeDetectorRef,
              private exportAsService: ExportAsService, private comSer:CommonServiceService,
              private router: Router) { }
  ngOnInit(): void {
    this.GetBranchMaster();
    this.fromdate = this.sys.CurrentDate;
    this.todate = this.sys.CurrentDate;
    this.reportcriteria = this.formBuilder.group({
      fromDate: [null, Validators.required],
      toDate: [null, null]
    });
    this.onLoadScreen(this.content);
  }
  onLoadScreen(content) {
    this.modalRef = this.modalService.show(content, this.config);
  }
  // NewWindow(){
  //   let serverIp = 'http://localhost:4200/';
  //   window.open(serverIp+[this.sys.BankName + '/la']);

  // }
  setPage(page: number) {
    this.currentPage = page;
    this.cd.detectChanges();
  }


  public SubmitReport() {
    if (this.reportcriteria.invalid) {
      this.showAlert = true;
      this.alertMsg = 'Invalid Input.';
      return false;
    }

    else {
      this.cashCr=0
      this.cashDr=0
      this.trfDr=0
      this.trfCr=0
      this.modalRef.hide();
      this.reportData.length=0;
      this.pagedItems.length=0;
      this.isLoading=true;
      this.fromdate=this.reportcriteria.value['fromDate'];
      var dt={
        "ardb_cd":this.sys.ardbCD,
        "brn_cd":this.sys.BranchCode,
        "trial_dt":this.fromdate.toISOString()
      }
      this.svc.addUpdDel('Common/GetUserTransactions',dt).subscribe(data=>{
        console.log(data)
        this.reportData=data
        debugger
        if(!this.reportData){
          this.comSer.SnackBar_Nodata()
          this.isLoading=false
        } 
          this.transactionDate = new Date(data[0]?.transDt);
          

          this.formattedData = this.reportData.map(t => this.mapRow(t));
        

        // for(let i=0;i<this.reportData.length;i++){

        //   this.cashCr+=this.reportData[i].acctype.tot_acc_ovd_prn_recov
        //   this.cashDr+=this.reportData[i].acctype.tot_acc_curr_prn_recov
        //   this.trfDr+=this.reportData[i].acctype.tot_acc_curr_intt_recov
        //   this.trfCr+=this.reportData[i].acctype.tot_acc_ovd_intt_recov

        // }
        // this.dataSource.data=this.reportData;
        // if(this.reportData.length<50){
        //   this.pagedItems=this.reportData
        // }
        this.isLoading=false
        
        this.modalRef.hide();
        
      },err => {
        this.isLoading = false;
        this.comSer.SnackBar_Error(); 
       })
     
      // this.showAlert = false;
      // this.fromdate = this.reportcriteria.controls.fromDate.value;
      // this.UrlString = this.svc.getReportUrl();
      // this.UrlString = this.UrlString + 'WebForm/Deposit/depositsubcashbook?'
      //   + 'ardb_cd='+this.sys.ardbCD
      //   + '&brn_cd=' + this.sys.BranchCode + '&from_dt='
      //   + Utils.convertDtToString(this.fromdate);
      // this.isLoading = true;
      // this.ReportUrl = this._domSanitizer.bypassSecurityTrustResourceUrl(this.UrlString)
      // this.modalRef.hide();
      // setTimeout(() => {
      //   this.isLoading = false;
      // }, 10000);
    }
  }
  
  public closeAlert() {
    this.showAlert = false;
  }


  closeScreen() {
    this.router.navigate([this.sys.BankName + '/la']);
  }
  
  downloadexcel(){
    this.exportAsConfig = {
      type: 'xlsx',
      // elementId: 'hiddenTab', 
      elementIdOrContent:'mattable'
    }
    this.exportAsService.save(this.exportAsConfig, 'UserTransDtls').subscribe(() => {
      // save started
      console.log("hello")
    });
  }
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  // applyFilter(event: Event) {
  //   const filterValue = (event.target as HTMLInputElement).value;
  //   this.dataSource.filter = filterValue.trim().toLowerCase();

  //   if (this.dataSource.paginator) {
  //     this.dataSource.paginator.firstPage();
  //   }
  //   this.getTotal()
  // }
  getTotal(){
    this.cashCr=0
      this.cashDr=0
      this.trfDr=0
      this.trfCr=0
    console.log(this.dataSource.filteredData)
    this.filteredArray=this.dataSource.filteredData
    for(let i=0;i<this.filteredArray.length;i++){
      // console.log(this.filteredArray[i].dr_amt)
      this.cashCr+=this.filteredArray[i].cash_cr
      this.cashDr+=this.filteredArray[i].cash_dr
      this.trfDr+=this.filteredArray[i].trf_dr
      this.trfCr+=this.filteredArray[i].trf_cr
      // this.crSum+=this.filteredArray[i].cr_amount
    }
  }
  mapRow(item: any) {
    return {
            ...item,
            createdByName: item.createdBy.split('/')[0],
            approvedByName: item.approvedBy.split('/')[0],
            trfTypeFull: item.trfType === 'T' ? 'Transfer' : item.trfType === 'C'?'Cash':item.trfType,
            intoAccTypeFull: item.intoAccTypeCd === 1 ? 'Saving' :
                            item.intoAccTypeCd === 7 ? 'Current' : item.intoAccTypeCd,
            transTypeFull: item.transType === 'D' ? 'Deposit' :
                          item.transType === 'W' ? 'Withdrawal' : 
                          item.transType === 'B' ? 'Disbursement' : 
                          item.transType === 'R' ? 'Recovery' : item.transType
          }
    };
  

  applyFilter() {
    this.formattedData = this.reportData
      .filter(item => {
        // ✅ branch filter
        const branchMatch = this.selectedBranch ? item.brnCd === this.selectedBranch : true;

        // ✅ global filter
        const search = this.globalSearch.trim().toLowerCase();
        const globalMatch = search ? Object.values(item).some(val =>
          String(val).toLowerCase().includes(search)
        ) : true;

        return branchMatch && globalMatch;
      })
      .map(t => this.mapRow(t));
  }
  private GetBranchMaster() {
    this.isLoading = true;
    var dt = { "ardb_cd": '1' };
    this.svc.addUpdDel<any>('Mst/GetBranchMaster',dt).subscribe(
     res => {
        //console.log(res)
        this.isLoading = false;
        this.branchMaster = res;
        this.branchMaster.sort((a, b) => a.brn_cd - b.brn_cd);
      },
      err => {
        this.isLoading = false;
       }
    );
  }
}
