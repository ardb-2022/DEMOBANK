import { SystemValues } from './../../../Models/SystemValues';
import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { RestService } from 'src/app/_service';

import { tt_cash_account, p_report_param } from 'src/app/bank-resolver/Models';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import Utils from 'src/app/_utility/utils';


@Component({
  selector: 'app-trading-acc',
  templateUrl: './trading-acc.component.html',
  styleUrls: ['./trading-acc.component.css']
})
export class TradingAccComponent implements OnInit {

  @ViewChild('content', { static: true }) content: TemplateRef<any>;

  // ReportUrl :SafeResourceUrl;
  // UrlString:string ="http://localhost:63011/"
  modalRef: BsModalRef;
  isOpenFromDp = false;
  isOpenToDp = false;
  UrlString = '';
  // UrlString = 'https://sssbanking.ufcsl.in/Report/DayBookViewer?';
  // UrlString = 'https://sssbanking.ufcsl.in/Report/DayBookViewer?brn_cd=101&from_dt=20/01/2019&to_dt=31/03/2021&acc_cd=28101';
  // Modal configuration
  config = {
    keyboard: false, // ensure esc press doesnt close the modal
    backdrop: true, // enable backdrop shaded color
    ignoreBackdropClick: true // disable backdrop click to close the modal
  };
  reportData:any[]=[];
  bsInlineValue = new Date();
  maxDate = new Date();
  dailyCash: tt_cash_account[] = [];
  prp = new p_report_param();
  sys = new SystemValues();
  reportcriteria: FormGroup;
  closeResult = '';
  showReport = false;
  showAlert = false;
  alertMsg = '';
  fd: any;
  td: any;
  dt: any;
  fromdate: Date;
  todate: Date;
  isLoading = false;
  counter=0;
  constructor(private svc: RestService, private formBuilder: FormBuilder,
    private modalService: BsModalService, private router: Router) { }
  ngOnInit(): void {

    this.fromdate = this.sys.CurrentDate; // new Date(localStorage.getItem('__currentDate'));
    this.todate = this.sys.CurrentDate; // new Date(localStorage.getItem('__currentDate'));
    this.reportcriteria = this.formBuilder.group({
      fromDate: [null, Validators.required]
    });
    this.onLoadScreen(this.content);
  }


  openModal(template: TemplateRef<any>) {
    this.modalRef = this.modalService.show(template);
  }



  private onLoadScreen(content) {

    this.modalRef = this.modalService.show(content, this.config);
  }


  public SubmitReport() {
    this.modalRef.hide();
    if (this.reportcriteria.invalid) {
      this.alertMsg = 'Invalid Input.';
      return false;
    }
  
    else {
      this.showAlert = false;
       this.isLoading = true;
      this.fromdate = this.reportcriteria.value.fromDate;
      var dt={
        "ardb_cd":this.sys.ardbCD,
        "brn_cd":this.sys.BranchCode,
        "trans_dt":this.fromdate.toISOString(),
        // "to_dt":this.todate.toISOString()
      }
      this.svc.addUpdDel<any>('Common/GetDenominationCheck',dt).subscribe(data=>{console.log(data)
      this.reportData=data;
        this.isLoading = false;
    },err=>{
       this.isLoading = false;
    })
    }
  }
  public oniframeLoad(): void {
    this.counter++;
    if(this.counter==2){
      this.isLoading=false;
      this.counter=0
    }
    else{
      this.isLoading=true
    }
    this.modalRef.hide();
  }

  public closeAlert() {
    this.showAlert = false;
  }

  closeScreen() {
    this.router.navigate([localStorage.getItem('__bName') + '/la']);
  }



}
