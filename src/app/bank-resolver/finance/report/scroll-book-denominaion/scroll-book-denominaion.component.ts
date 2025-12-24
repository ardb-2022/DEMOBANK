import { ChangeDetectorRef, Component, ElementRef, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { p_report_param, SystemValues } from 'src/app/bank-resolver/Models';
import { RestService } from 'src/app/_service';
import Utils from 'src/app/_utility/utils';
import { PageChangedEvent } from "ngx-bootstrap/pagination/public_api";
import { ExportAsService, ExportAsConfig } from 'ngx-export-as';
import { CommonServiceService } from 'src/app/bank-resolver/common-service.service';
import html2pdf from 'html2pdf.js';
import { mm_acc_type } from 'src/app/bank-resolver/Models/deposit/mm_acc_type';

@Component({
  selector: 'app-scroll-book-denominaion',
  templateUrl: './scroll-book-denominaion.component.html',
  styleUrls: ['./scroll-book-denominaion.component.css'],
  providers:[ExportAsService]

})
export class ScrollBookDenoComponent implements OnInit {
  @ViewChild('hiddenTab') hiddenTab!: ElementRef;
  @ViewChild('content', { static: true }) content: TemplateRef<any>;
  modalRef: BsModalRef;
  accTypeMaster:any[] =[]
  isOpenFromDp = false;
  isOpenToDp = false;
  sys = new SystemValues();
  config = {
    keyboard: false, // ensure esc press doesnt close the modal
    backdrop: true, // enable backdrop shaded color
    ignoreBackdropClick: true // disable backdrop click to close the modal
  };
  // trailbalance: tt_trial_balance[] = [];
  prp = new p_report_param();
  reportcriteria: FormGroup;
  closeResult = '';
  showReport = false;
  showAlert = false;
  isLoading = false;
  ReportUrl: SafeResourceUrl;
  exportAsConfig:ExportAsConfig;

  UrlString = '';
  alertMsg = '';
  fd: any;
  td: any;
  dt: any;
  fromdate: Date;
  todate: Date;
  counter=0;
  itemsPerPage = 50;
  currentPage = 1;
  pagedItems = [];
  reportData:any=[];
  originalData:any=[]
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
  lastLi:any;
  lastAss:any;
  li=0;
  ass=0;
  today:any;
  reportDate: any;

  groupedData: any[] = [];

  denominationKeys = [
    'two_thousand', 'thousand', 'five_hundred',
    'two_hundred', 'one_hundred', 'fifty',
    'twenty', 'ten', 'five', 'two', 'one'
  ];

  openingBalance = 0.00;

  totalDeposit = 0;
  totalWithdrawal = 0;
  closingBalance = 0;

  totalDenominations: any = {};
  totalDenominationValue = 0;
  filterForm!: FormGroup;
  constructor(private svc: RestService, private formBuilder: FormBuilder,private exportAsService: ExportAsService,
              private modalService: BsModalService, private _domSanitizer: DomSanitizer, private cd: ChangeDetectorRef,
              private router: Router, private comser:CommonServiceService) { }
  ngOnInit(): void {
      this.getAccountTypeList();
      this.filterForm = this.formBuilder.group({
      depositFrom: [null],
      depositTo: [null],
      withdrawFrom: [null],
      withdrawTo: [null],
      custId: [''],
      accNum: ['']
    });
    this.fromdate = this.sys.CurrentDate;
    this.todate = this.sys.CurrentDate;
    this.reportcriteria = this.formBuilder.group({
      fromDate: [null, Validators.required],
      toDate: [null, null]
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
    getAccountTypeList() {
    if (this.accTypeMaster.length > 0) {
      return;
    }
    this.accTypeMaster = [];
    this.accTypeMaster = [];
    this.accTypeMaster = [];

    this.svc.addUpdDel<any>('Mst/GetAccountTypeMaster', null).subscribe(
      res => {

        this.accTypeMaster = res;
        this.accTypeMaster = this.accTypeMaster.sort((a, b) => (a.acc_type_cd > b.acc_type_cd) ? 1 : -1);
       
       
      });
  }
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
      this.opdrSum=0;
      this.opcrSum=0
      this.modalRef.hide()
      this.reportData.length=0;
      this.pagedItems.length=0
      this.showAlert = false;
      this.fromdate=this.reportcriteria.value['fromDate'];
      // this.todate=this.reportcriteria.value['toDate'];
      //this.isLoading=true;
      //this.onReportComplete();
      // this.modalService.dismissAll(this.content);
      var dt={
        "ardb_cd":this.sys.ardbCD,
        "brn_cd":this.sys.BranchCode,
        "from_dt":this.fromdate.toISOString(),
        // "to_dt":this.todate.toISOString()
      }
      this.svc.addUpdDel('Common/ScrollBookDenomination',dt).subscribe(data=>{console.log(data)
      this.reportData=data;
      this.originalData=data;
      if(this.reportData){
        this.openingBalance=this.reportData[0]?.prev_balance_amt;
        this.calculateTotals();
         this.groupTransactionsByAccountType();
      } else{
        this.comser.SnackBar_Nodata()
      }
      this.isLoading=false
      
      this.modalRef.hide();
     
      },
      err => {
         this.isLoading = false;
         this.comser.SnackBar_Error(); 
        })
      
      // this.UrlString=this.svc.getReportUrl()
      // this.UrlString=this.UrlString+"WebForm/Fin/cashcumtrail?" + 'ardb_cd=' + this.sys.ardbCD+"&brn_cd="+this.sys.BranchCode+"&from_dt="+Utils.convertDtToString(this.fromdate)+"&to_dt="+Utils.convertDtToString(this.todate)
      ;
      this.isLoading = true;
      this.ReportUrl=this._domSanitizer.bypassSecurityTrustResourceUrl(this.UrlString)

      // setTimeout(() => {
      //   this.isLoading = false;
      // }, 10000);
    }
  }
 groupTransactionsByAccountType() {
  const grouped = new Map<string, any[]>();

  for (const tx of this.reportData) {
    let groupKey: string;

    if (tx.acc_type_cd === 'Cash Voucher') {
      groupKey = 'cash-voucher';
    } else if (tx.acc_type_cd === 'Coin Transfer') {
      groupKey = 'coin-transfer';
    }
    else if(tx.acc_type_cd == 'Opening Denomination'){
      groupKey = 'Opening Denomination';
    }
    else {
      groupKey = `acc-${tx.acc_type_cd}`;
    }

    if (!grouped.has(groupKey)) grouped.set(groupKey, []);
    grouped.get(groupKey)?.push(tx);
  }

  this.groupedData = Array.from(grouped.entries()).map(([key, transactions]) => {
    let acc_type_cd: number | null = null;
    let acc_type_desc = 'UNKNOWN';

    if (key === 'cash-voucher') {
      acc_type_desc = 'Cash Voucher';
    } else if (key === 'coin-transfer') {
      acc_type_desc = 'Coin Transfer';
    }else if (key === 'Opening Denomination') {
      acc_type_desc = 'Opening Denomination';
    } else if (key.startsWith('acc-')) {
      acc_type_cd = +key.replace('acc-', '');
      acc_type_desc =
        this.accTypeMaster.find(m => +m.acc_type_cd === acc_type_cd)?.acc_type_desc || 'UNKNOWN';
    }

    return { acc_type_cd, acc_type_desc, transactions };
  });
}
  public closeAlert() {
    this.showAlert = false;
  }


  closeScreen() {
    this.router.navigate([this.sys.BankName + '/la']);
  }
   calculateTotals() {
    this.totalDeposit = this.reportData
      .filter(tx => tx.trans_type === 'Deposit')
      .reduce((sum, tx) => sum + tx.trans_amt, 0);

    this.totalWithdrawal = this.reportData
      .filter(tx => tx.trans_type === 'Withdrawl')
      .reduce((sum, tx) => sum + tx.trans_amt, 0);

    this.closingBalance = ((this.openingBalance + this.totalDeposit) - this.totalWithdrawal);

    this.denominationKeys.forEach(key => {
      this.totalDenominations[key] = this.reportData.reduce((sum, tx) => sum + (tx[key] || 0), 0);
    });
    const denominationValues = {
      two_thousand: 2000,
      thousand: 1000,
      five_hundred: 500,
      two_hundred: 200,
      one_hundred: 100,
      fifty: 50,
      twenty: 20,
      ten: 10,
      five: 5,
      two: 2,
      one: 1
    };

    this.totalDenominationValue = this.denominationKeys.reduce((total, key) =>
      total + (this.totalDenominations[key] || 0) * denominationValues[key], 0);
  }
  applyFilter() {
  const {
    depositFrom,
    depositTo,
    withdrawFrom,
    withdrawTo,
    custId,
    accNum
  } = this.filterForm.value;

  const filtered = this.reportData.filter(tx => {
    const isDepositValid = tx.trans_type === 'Deposit' ?
      (depositFrom == null || tx.trans_amt >= depositFrom) &&
      (depositTo == null || tx.trans_amt <= depositTo) : true;

    const isWithdrawalValid = tx.trans_type === 'Withdrawl' ?
      (withdrawFrom == null || tx.trans_amt >= withdrawFrom) &&
      (withdrawTo == null || tx.trans_amt <= withdrawTo) : true;

    const isCustIdMatch = custId ? tx.cust_cd.toString().includes(custId) : true;
    const isAccNumMatch = accNum ? tx.acc_num.toString().includes(accNum) : true;

    return isDepositValid && isWithdrawalValid && isCustIdMatch && isAccNumMatch;
  });

  this.reportData = filtered;
  this.groupTransactionsByAccountType();
  this.calculateTotals();
}
resetFilter() {
  this.filterForm.reset();
  this.reportData = [...this.originalData]; // Keep originalData as master
  this.groupTransactionsByAccountType();
  this.calculateTotals();
}
   exportToPDF() {
    const element = document.querySelector('#hiddenTab') as HTMLElement;
    html2pdf().from(element).save('Scroll_Book_Report.pdf');
  }
}
