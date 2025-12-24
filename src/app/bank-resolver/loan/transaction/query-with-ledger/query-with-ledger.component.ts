import { Component, ElementRef, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { MessageType, mm_acc_type, mm_customer, mm_kyc, p_loan_param, ShowMessage, SystemValues } from 'src/app/bank-resolver/Models';
import { InAppMessageService, RestService } from 'src/app/_service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { environment } from 'src/environments/environment';
import { p_gen_param } from 'src/app/bank-resolver/Models/p_gen_param';

@Component({
  selector: 'app-query-with-ledger',
  templateUrl: './query-with-ledger.component.html',
  styleUrls: ['./query-with-ledger.component.css']
})
export class QueryWithLedgerComponent implements OnInit {

  constructor(private frmBldr: FormBuilder,private svc: RestService, private elementRef: ElementRef,
    private msg: InAppMessageService, private modalService: BsModalService,
    private router: Router) { }
    sys = new SystemValues();
    accountTypeList: mm_acc_type[]= [];
    param :p_loan_param[]=[];
    isTrade: boolean = false;
    isLoading = false;
    modalRef: BsModalRef;
    custMstrFrm: FormGroup;
    get f() { return this.custMstrFrm.controls; }
    relStatus:any;
    lbr_status: any = [];
    KYCTypes: mm_kyc[] = [];
    uniqueUCIC:number=0
    showMsg: ShowMessage;
    isOpenFromDp = false;
    asOnDate : any;
    suggestedCustomer: any[];
    suggestedCustomer2: any[]=[];
    custNAME:any;
  ngOnInit(): void {
    this.getAccountTypeList();
   
    this.asOnDate =this.sys.CurrentDate;
  }

  onBackClick() {
    this.router.navigate([this.sys.BankName + '/la']);
  }
 
  getAccountTypeList() {
    ;

    this.svc.addUpdDel<any>('Mst/GetAccountTypeMaster', null).subscribe(
      res => {
        ;
        this.accountTypeList = res;
        this.accountTypeList = this.accountTypeList.sort((a, b) => (a.acc_type_cd > b.acc_type_cd) ? 1 : -1);
      },
      err => {
        ;
      }
    );
  }

  onReset(){
    this.suggestedCustomer = [];
  }
  getAllCustomer(){
    this.isLoading=true;
    const prm = new p_gen_param();
     prm.as_cust_name = this.custNAME;
     prm.ardb_cd=this.sys.ardbCD;
    this.svc.addUpdDel<any>('Loan/GetLoanLedgerDtls', prm).subscribe(
      res => {
        console.log(res)
        this.isLoading=false;
        if (undefined !== res && null !== res && res.length > 0) {
          this.suggestedCustomer = res
          const typeMap = new Map(
            this.accountTypeList.map(m => [String(m.acc_type_cd), m.acc_type_desc])
          );

          // enrich your data array with accTypeDesc
          this.suggestedCustomer = this.suggestedCustomer.map(item => ({
            ...item,
            accTypeDesc: typeMap.get(String(item.accTypeCd)) || "NOT FOUND"
          }));
          console.log(this.suggestedCustomer);
          
        } else {
          this.suggestedCustomer = [];
          
        }
      },
      err => { this.isLoading = false; }
    );
  }

  /** Below method handles message show/hide */
  private HandleMessage(show: boolean, type: MessageType = null, message: string = null) {
    this.showMsg = new ShowMessage();
    this.showMsg.Show = show;
    this.showMsg.Type = type;
    this.showMsg.Message = message;
  }

}
