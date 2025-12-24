import { ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
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
import { MatTableDataSource } from '@angular/material/table';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import { CommonServiceService } from 'src/app/bank-resolver/common-service.service';
import { tm_loan_all } from 'src/app/bank-resolver/Models/loan/tm_loan_all';
import { LoanOpenDM } from 'src/app/bank-resolver/Models/loan/LoanOpenDM';
@Component({
  selector: 'app-bmloan-statement',
  templateUrl: './bmloan-statement.component.html',
  styleUrls: ['./bmloan-statement.component.css'],
  providers: [ExportAsService]
})
export class BMLoanStatementComponent implements OnInit {

  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild('content', { static: true }) content: TemplateRef<any>;
  disabledOnNull = true;
  modalRef: BsModalRef;
  isOpenFromDp = false;
  isOpenToDp = false;
  counter = 0;
  filteredArray:any=[]
  sys = new SystemValues();
  displayedColumns: string[] = ['trans_dt', 'disb_amt','curr_prn_recov','ovd_prn_recov','adv_prn_recov','curr_intt_recov','ovd_intt_recov','penal_intt_recov','tot_recov','curr_prn','curr_intt','narr'];
  dataSource = new MatTableDataSource()
  config = {
    keyboard: false, // ensure esc press doesnt close the modal
    backdrop: true, // enable backdrop shaded color
    ignoreBackdropClick: true, // disable backdrop click to close the modal
    class: 'modal-lg'
  };
  ardbCD:any =this.sys.ardbCD;
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
  exportAsConfig: ExportAsConfig;
  itemsPerPage = 50;
  currentPage = 1;
  pagedItems = [];
  reportData: any = []
  ardbName = localStorage.getItem('ardb_name')
  branchName = this.sys.BranchName
  acc1 = new tm_loan_all();
  acc = new LoanOpenDM();
  pageChange: any;
  opdrSum = 0;
  opcrSum = 0;
  drSum = 0;
  crSum = 0;
  clsdrSum = 0;
  clscrSum = 0;
  lastAccCD: any;
  today: any
  cName: any
  cAddress: any
  cAcc: any
  intRate:any
  actvDtls:any
  lastAccNum: any
  currInttSum = 0
  ovdInttSum = 0
  ovdPrnSum = 0
  currPrnSum = 0
  currInttRecovSum = 0
  ovdInttRecovSum = 0
  ovdPrnRecovSum = 0
  currPrnRecovSum = 0
  totPrn = 0;
  loanId: any;
  custNm:any;
  addr:any;
  suggestedCustomer: mm_customer[];
  recovSum=0;
  disbSum=0;
  lastDt:any;
  lastCd:any;
  penalInttSum=0
  penalInttRecovSum=0;
  advPrnRecovSum=0;
  showWait=false
  resultLength=0;
  currInttCalSum = 0
  ovdInttCalSum = 0
  penalInttCalSum=0
  notvalidate:boolean=false;
  date_msg:any;
  allLoanType:any;
  LoanType:any
  constructor(private svc: RestService, private formBuilder: FormBuilder,
    private modalService: BsModalService, private _domSanitizer: DomSanitizer, private exportAsService: ExportAsService, private cd: ChangeDetectorRef,
    private router: Router, private comSer: CommonServiceService) { }
  ngOnInit(): void {
    this.svc.addUpdDel<mm_operation[]>('Mst/GetOperationDtls', null).subscribe(
      res => {console.log(res);
       this.allLoanType=res;
      })
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.fromdate = this.sys.CurrentDate;
    this.reportcriteria = this.formBuilder.group({
      fromDate: [null, Validators.required],
      toDate: [null, Validators.required],
      acct_num: [null, Validators.required]
    });
    this.onLoadScreen(this.content);
    var date = new Date();
    var n = date.toDateString();
    var time = date.toLocaleTimeString();
    this.today = n + " " + time
  }
  onLoadScreen(content) {
    this.notvalidate=false
    this.modalRef = this.modalService.show(content, this.config);
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
  setPage(page: number) {
    this.currentPage = page;
    this.cd.detectChanges();
  }
  pageChanged(event: PageChangedEvent): void {
    const startItem = (event.page - 1) * event.itemsPerPage;
    const endItem = event.page * event.itemsPerPage;
    this.pagedItems = this.reportData.slice(startItem, endItem); //Retrieve items for page
    console.log(this.pagedItems)

    this.cd.detectChanges();
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
    this.loanId=cust.loan_id
    this.custNm=cust.cust_name
    this.addr=cust.present_address
    this.reportcriteria.controls.acct_num.setValue(cust.loan_id);
    this.suggestedCustomer = null;
    debugger
  }

  public SubmitReport() {
    // this.comSer.getDay(this.fromdate,this.toDate)

    if (this.reportcriteria.invalid) {
      this.showAlert = true;
      this.alertMsg = 'Invalid Input.';
      return false;
    }
    else if(this.reportcriteria.controls.fromDate.value>this.reportcriteria.controls.toDate.value){
      this.date_msg= this.comSer.date_msg
      this.notvalidate=true
    }

    else {
    
      this.reportData.length=0;
      this.pagedItems.length=0;
      this.modalRef.hide();
      this.isLoading=true
      this.fromdate = this.reportcriteria.controls.fromDate.value;
      this.toDate = this.reportcriteria.controls.toDate.value;
      var dt = {
        "ardb_cd": this.sys.ardbCD,
        "brn_cd": this.sys.BranchCode,
        "loan_id": this.reportcriteria.controls.acct_num.value,
        // "from_dt": this.fromdate.toISOString(),
        "from_dt": this.fromdate,
        // "to_dt": this.toDate.toISOString()
        "to_dt": this.toDate
      }
      this.svc.addUpdDel('Loan/GetLoanStatement', dt).subscribe(data => {
        console.log(data)
        this.reportData = data
        if(!this.reportData){
          this.comSer.SnackBar_Nodata()
          this.isLoading=false
        }
        this.isLoading = false
      
        this.modalRef.hide();
       
      },
      err => {
         this.isLoading = false;
         this.comSer.SnackBar_Error(); 
        }
      
      )
    }
   
  }
   downloadexcel(){
    this.exportAsConfig = {
      type: 'xlsx',
      // elementId: 'hiddenTab', 
      elementIdOrContent:'mattable'
    }
    this.exportAsService.save(this.exportAsConfig, 'Loan Stmt').subscribe(() => {
      // save started
      console.log("hello")
    });
  }
  
getTotal(field: string): number {
  return this.reportData.reduce((sum, row) => sum + (row[field] || 0), 0);
}

getTotalCalcInterest(): number {
  return this.reportData.reduce(
    (sum, row) => sum + ((row.curr_intt_calculated || 0) + (row.ovd_intt_calculated || 0)),
    0
  );
}

getTotalBalancePrn(): number {
  return this.reportData.reduce(
    (sum, row) => sum + ((row.curr_prn || 0) + (row.ovd_prn || 0)),
    0
  );
}
getTotalBalanceIntt(): number {
  return this.reportData.reduce(
    (sum, row) => sum + ((row.curr_intt || 0) + (row.ovd_intt || 0)),
    0
  );
}
getTotalBalanceTotal(): number {
  return this.reportData.reduce(
    (sum, row) => sum + ((row.curr_prn || 0) + (row.ovd_prn || 0)+(row.curr_intt || 0)+(row.ovd_intt || 0)),
    0
  );
}

  public oniframeLoad(): void {
    this.counter++
    if (this.counter == 2) {
      this.isLoading = false;

    }
    else {
      this.isLoading = true;
    }
    this.modalRef.hide();
  }
  public closeAlert() {
    this.showAlert = false;
  }


  closeScreen() {
    this.router.navigate([this.sys.BankName + '/la']);
  }
  
 
  getGrandTotal(type: 'dr' | 'cr'): number {
  if (!this.reportData) return 0;
  return this.reportData.reduce((sum, row) => {
    if (type === 'dr') {
      return sum + (row.dr_amt || 0);
    } else {
      return sum + (row.cr_amt || 0);
    }
  }, 0);
}
}
