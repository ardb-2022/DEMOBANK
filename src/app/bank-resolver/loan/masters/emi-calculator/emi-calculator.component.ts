import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { RestService } from 'src/app/_service';
import { LOGIN_MASTER, MessageType, ShowMessage, SystemValues, mm_dist } from '../../../Models';
import { m_branch } from '../../../Models/m_branch';
import { HttpClient } from '@angular/common/http';
@Component({
  selector: 'app-emi-calculator',
  templateUrl: './emi-calculator.component.html',
  styleUrls: ['./emi-calculator.component.css']
})
export class EmiCalculatorComponent implements OnInit {
  config = {
    keyboard: false, // ensure esc press doesnt close the modal
    backdrop: true, // enable backdrop shaded color
    ignoreBackdropClick: true // disable backdrop click to close the modal
  };
  districts: mm_dist[] = [];
  brnDtls: m_branch[]=[];
  sys = new SystemValues()
  isLoading=false;
  addVill: FormGroup;
  showMsg: ShowMessage;
  totalPrn:any=0;
  totalIntt:any=0
  totalEMI:any=0;
  emiForm: FormGroup;
  emiData: any[] = [];
  today:any;
  ardbName = localStorage.getItem('ardb_name')
  branchName = this.sys.BranchName;
  // displayedColumns: string[] = ['emi_no', 'emi_prn', 'emi_intt', 'total_emi'];

  constructor(private router: Router,private formBuilder: FormBuilder,private svc: RestService,private modalService: BsModalService,) { }
  @ViewChild('contentbatch', { static: true }) contentbatch: TemplateRef<any>;
  modalRef: BsModalRef;
  ngOnInit(): void {
  
   this.emiForm = this.formBuilder.group({
      ad_prn_amt: [0.0],
      ad_intt_rt: [0.0],
      ad_instl_amt: [0],
      emi_formula: [1]
    });

  }
  get f() { return this.emiForm.controls; }
  closeScreen()
  {
    this.router.navigate([localStorage.getItem('__bName') + '/la']);
  }
 


  calculateEMI(){
    this.totalPrn=0;
    this.totalIntt=0;
    this.totalEMI=0;
    this.isLoading=true;
     const payload = this.emiForm.value;
    this.svc.addUpdDel<mm_dist[]>('loan/GetEmiDisplay', payload).subscribe(
      res => {
        this.isLoading=false;
        this.emiData = res;
        this.emiData.forEach(e=>{
        this.totalPrn+=e.emi_prn;
        this.totalIntt+=e.emi_intt
        this.totalEMI+=e.total_emi;
      })
      },
      err => {
        this.isLoading=false;
        console.log(err);
       }
    );
  }

  private HandleMessage(show: boolean, type: MessageType = null, message: string = null) {
    this.showMsg = new ShowMessage();
    this.showMsg.Show = show;
    this.showMsg.Type = type;
    this.showMsg.Message = message;
  }

}
