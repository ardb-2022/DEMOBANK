import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { RestService } from 'src/app/_service';
import { LOGIN_MASTER, MessageType, ShowMessage, SystemValues, mm_customer, mm_dist, tm_deposit } from '../../../Models';
import { m_branch } from '../../../Models/m_branch';
import { p_gen_param } from 'src/app/bank-resolver/Models/p_gen_param';
import { AccOpenDM } from 'src/app/bank-resolver/Models/deposit/AccOpenDM';

@Component({
  selector: 'app-cert-status-update',
  templateUrl: './cert-status-update.component.html',
  styleUrls: ['./cert-status-update.component.css']
})
export class CertStatusUpdateComponent implements OnInit {
  config = {
    keyboard: false, // ensure esc press doesnt close the modal
    backdrop: true, // enable backdrop shaded color
    ignoreBackdropClick: true // disable backdrop click to close the modal
  };
  disablePrint:boolean=false
  printFlag:any=''
  districts: mm_dist[] = [];
  tm_deposit = new tm_deposit();
  masterModel = new AccOpenDM();
  brnDtls: m_branch[]=[];
  sys = new SystemValues()
  isLoading=false;
  addBlock: FormGroup;
  showMsg: ShowMessage;
  isDel = false;
  isRetrieve = false;
  isNew = false;
  isModify = false;
  isSave = false;
  isClear = false;
  blocks:any=[];
  blocks1:any=[];
  AcctTypes2:any[]=[];
  disableCode=true;
  b_name:any;
  hiddenOnNull=true;
  suggestedCustomer: mm_customer[];
  disabledOnNull=true;
  constructor(private router: Router,private formBuilder: FormBuilder,private svc: RestService,private modalService: BsModalService,) { }
  @ViewChild('contentbatch', { static: true }) contentbatch: TemplateRef<any>;
  modalRef: BsModalRef;
  ngOnInit(): void {
    this.getAccountTypeList();
    // this.GetBranchMaster();
    // this.getAllBlocks()
   this.blocks=null;
   this.blocks1=null
    this.addBlock = this.formBuilder.group({
      acc_type_cd: ['', Validators.required],
      acc_num: ['', Validators.required]
    });
    // this.addBlock.controls.code.disable()
    this.isDel = false;
    this.isRetrieve = true;
    this.isNew = true;
    this.isModify = false;
    this.isSave = false;
    this.isClear = true;
    // this.getDistMaster();
  }
  get f() { return this.addBlock.controls; }
  closeScreen()
  {
    this.router.navigate([localStorage.getItem('__bName') + '/la']);
  }
 onChangeNull(){
    this.suggestedCustomer = null

    if (this.f.acc_num.value.length > 0) 
      this.disabledOnNull=false
    else 
      this.disabledOnNull=true
  }
    getAccountTypeList() {

    if (this.AcctTypes2.length > 0) {
      return;
    }
    this.AcctTypes2 = [];
    var dt={
      "ardb_cd":this.sys.ardbCD
    }
    this.svc.addUpdDel<any>('Mst/GetAccountTypeMaster', dt).subscribe(
      res => {
      
        this.AcctTypes2 = res;
        this.AcctTypes2 = this.AcctTypes2.filter(c => c.dep_loan_flag === 'D');
        this.AcctTypes2 = this.AcctTypes2.sort((a, b) => (a.acc_type_cd > b.acc_type_cd) ? 1 : -1);
        this.AcctTypes2 = this.AcctTypes2.filter(c => c.dw_obj=='TD' || c.dw_obj=='FD' ||c.dw_obj=='MIS');
      },
      err => {

      }
    );
  }
 public onAccountTypeChange(): void {
    this.f.acc_num.setValue('');
    this.suggestedCustomer = null;
    if (+this.f.acc_type_cd.value > 0) {
      this.f.acc_num.enable();
    }
  }
  public suggestCustomer(): void {
    if (this.f.acc_num.value.length > 0) {
      const prm = new p_gen_param();
      prm.ad_acc_type_cd = (+this.f.acc_type_cd.value);
      prm.as_cust_name = this.f.acc_num.value.toLowerCase();
      this.svc.addUpdDel<any>('Deposit/GetAccDtls', prm).subscribe(
        res => {
          if (undefined !== res && null !== res && res.length > 0) {
            this.suggestedCustomer = res.slice(0, 10);
          } else {
            this.suggestedCustomer = [];
          }
        },
        

        err => { this.isLoading = false; }
      );
    } else {
      this.suggestedCustomer = null;
    }
  }

  public SelectCustomer(cust: any): void {
    this.f.acc_num.setValue(cust.acc_num);
    this.suggestedCustomer = null;
    this.getDeposit(cust.acc_num);
  }

getDeposit(i:any){
  this.isLoading=true;
  this.tm_deposit.acc_type_cd=(+this.f.acc_type_cd.value)
  this.tm_deposit.acc_num=i;
      this.svc.addUpdDel<any>('Deposit/GetAccountOpeningData', this.tm_deposit).subscribe(
        res => {
          // this.showTable=true;
          //debugger;
          console.log(res);
          
          this.isLoading = false;
          this.masterModel = res;
          if(this.masterModel.tmdeposit.acc_num){
            this.getPrintFlag();
          }
        })
}

getPrintFlag(){
  debugger
  var dc={
    "ardb_cd":this.sys.ardbCD,
    "renew_id":this.masterModel.tmdeposit.renew_id,
    "acc_num":this.masterModel.tmdeposit.acc_num,
    "acc_type_cd":(+this.f.acc_type_cd.value)
   }
   debugger
   this.svc.addUpdDel<any>('Deposit/GetCertificateStatus',dc).subscribe(
      res=>{
      console.log(res);
      debugger
      this.printFlag=res;
      if(this.printFlag=='Y'){
        debugger
        // this.modalRef = this.modalService.show(this.alreadyUpdate, this.config);
        this.disablePrint=true;
      }
      else{this.disablePrint=false;}
    },
    err=>{
      this.printFlag=err.error.text
      debugger
      console.log(err.error.text);
      if(this.printFlag=='Y'){
        debugger
        // this.modalRef = this.modalService.show(this.alreadyUpdate, this.config);
        this.disablePrint=true;
      }
      else{this.disablePrint=false;}
      
    })
   
  

}
unlockPrintStatus(){
  this.isLoading=true
  var dc={
    
      "ardb_cd":this.sys.ardbCD,
      "brn_cd": this.sys.BranchCode,
      "acc_type_cd":(+this.f.acc_type_cd.value),
     "acc_num" :this.masterModel.tmdeposit.acc_num
   }
   debugger
   this.svc.addUpdDel<any>('Deposit/UpdateCertPrintStatus',dc).subscribe(
      res=>{
        this.isLoading=false; 
         this.HandleMessage(true, MessageType.Sucess,'Print status update successfully!' );
         this.disablePrint=false;
         this.f.acc_num.setValue('');
         this.f.acc_type_cd.setValue('');
      },
    err=>{
      this.isLoading=false; 
      this.HandleMessage(true, MessageType.Error,'Updation failed!!' );
    })
}
















  getDistMaster(){
    this.svc.addUpdDel<mm_dist[]>('Mst/GetDistMaster', null).subscribe(
      res => {
        this.districts = res;
      },
      err => { }
    );
  }
  new()
  {
    this.isDel = false;
    this.isRetrieve = false;
    this.isNew = false;
    this.isModify = false;
    this.isSave = true;
    this.isClear = true;
    // this.GetBranchMaster();
  }
  selectBlock(block:any){
    this.addBlock.controls.code.setValue(block.block_cd);
    this.addBlock.controls.bname.setValue(block.block_name)
    this.blocks1=null
  }
  getAllBlocks(){
    var dt = {
      "ardb_cd": this.sys.ardbCD,
    }
    // this.svc.addUpdDel<mm_block[]>('Mst/GetBlockMaster', this.sys.ardbCD).subscribe(
    this.svc.addUpdDel<any>('Mst/GetBlockMaster', dt).subscribe(
      res => {
        console.log(res)
        this.blocks = res
        this.blocks = this.blocks.sort((a, b) => (a.block_name > b.block_name) ? 1 : -1);
        this.blocks1=res
        this.blocks1 = this.blocks1.sort((a, b) => (a.block_name > b.block_name) ? 1 : -1);
        //  this.b_name=this.blocks.filter(e=>e.block_cd==this.addBlock.controls.code.value)[0].block_name
        console.log(this.addBlock.controls.code.value)
        this.blocks=this.blocks1.filter(e=>e.block_cd.includes(this.addBlock.controls.code.value) || e.block_name.toLowerCase().includes(this.addBlock.controls.code.value.toLowerCase()))
         console.log(this.blocks)
      },
      err => { }
    );
  }
  GetBranchMaster()
  {
    this.isLoading=true;
    ;
    this.svc.addUpdDel('Mst/GetBranchMaster', null).subscribe(
      res => {
        ;
        this.brnDtls=res;
        this.isLoading=false;

      },
      err => {this.isLoading=false; ;}
    )
  }
  OpenBlock(block:any){
    console.log(block)
    this.addBlock.patchValue({
      code:block.block_cd,
      bname:block.block_name
    })
    this.modalRef.hide();
    this.isModify=true
    this.showMsg=null
  }
  getBlock(){
    
    if(this.addBlock.controls.code.value)
   {
    this.getAllBlocks()
    // this.b_name=this.blocks.filter(e=>e.block_cd==this.addBlock.controls.code.value)[0].block_name

   }
    this.addBlock.controls.bname.setValue(this.b_name)
  }
  retrieve ()
  {
    this.hiddenOnNull=false
    this.disableCode=false;
    
    this.addBlock.controls.code.enable()
    this.isModify=true
    // this.getAllBlocks()
  }
  saveuser()
  {
    this.isLoading=true;
    this.showMsg =null;
    var dt={
      "block_name":this.addBlock.controls.bname.value,
      "ardb_cd":this.sys.ardbCD,
      "dist_cd":this.addBlock.controls.district.value,
      "state_cd":this.addBlock.controls.state.value,
    }
    console.log(this.addBlock.controls)
    this.svc.addUpdDel('Mst/InsertBlockMaster', dt).subscribe(
      res => {
        console.log(res)
        ;
        this.isLoading=false;
        this.HandleMessage(true, MessageType.Sucess,'Block saved successfully!' );
        // this.initialize();
        this.addBlock.controls.code.setValue(res)
        this.isDel = false;
        this.isRetrieve = true;
        this.isNew = true;
        this.isModify = false;
        this.isSave = false;
        this.isClear = true;
        this.disableCode=true
      this.addBlock.controls.code.disable()

      },
      err => {this.isLoading=false; ; this.HandleMessage(true, MessageType.Error,'Insertion failed!!' );
              this.isDel = false;
              this.isRetrieve = false;
              this.isNew = false;
              this.isModify = false;
              this.isSave = true;
              this.isClear = true;
    }
    )
  }
  updateuser()
  {
    this.isLoading=true;
    this.showMsg =null;
    let login = new LOGIN_MASTER();
    var dt={
      "block_name":this.addBlock.controls.bname.value,
      "ardb_cd":this.sys.ardbCD,
      "block_cd":this.addBlock.controls.code.value
    }
    //login.login_status='N';
    ;
    this.svc.addUpdDel('Mst/UpdateBlock',dt).subscribe(
      res => {
        ;
        this.isLoading=false;
        this.HandleMessage(true, MessageType.Sucess,'Block updated successfully!' );
        // this.initialize();
        this.isDel = false;
        this.isRetrieve = true;
        this.isNew = true;
        this.isModify = false;
        this.isSave = false;
        this.isClear = true;
        this.disableCode=true
        this.addBlock.controls.code.disable()

      },
      err => {this.isLoading=false; ; this.HandleMessage(true, MessageType.Error,'Updation failed!!' );
      this.isDel = false;
      this.isRetrieve = true;
      this.isNew = true;
      this.isModify = true;
      this.isSave = false;
      this.isClear = true;
    }
    )
  }
  deleteuser()
  {
    this.isLoading=true;
    this.showMsg =null;
    let login = new LOGIN_MASTER();
    login.user_id = this.f.userid.value;
    login.brn_cd = this.f.branch.value;
    ;
    this.svc.addUpdDel('Sys/DeleteUserMaster', login).subscribe(
      res => {
        ;
        this.isLoading=false;
        this.HandleMessage(true, MessageType.Sucess,'Block deleted successfully!' );
        this.initialize();
        this.isDel = false;
        this.isRetrieve = true;
        this.isNew = true;
        this.isModify = false;
        this.isSave = false;
        this.isClear = true;
      },
      err => {this.isLoading=false; ; this.HandleMessage(true, MessageType.Error,'Deletion failed!!' );
      this.initialize();
      this.isDel = false;
      this.isRetrieve = true;
      this.isNew = true;
      this.isModify = false;
      this.isSave = false;
      this.isClear = true;
    }
    )
 }
  clearuser()
  {
    this.initialize();
    this.isDel = false;
    this.isRetrieve = true;
    this.isNew = true;
    this.isModify = false;
    this.isSave = false;
    this.isClear = true;
  }
  initialize()
  {
   this.addBlock.reset()
   this.addBlock.controls.state.setValue(2)
   this.addBlock.controls.district.setValue('01')
   this.disableCode=true;
   this.hiddenOnNull=true
   this.blocks=null
   this.blocks1=null
   this.addBlock.controls.code.disable()

  }
  private HandleMessage(show: boolean, type: MessageType = null, message: string = null) {
    this.showMsg = new ShowMessage();
    this.showMsg.Show = show;
    this.showMsg.Type = type;
    this.showMsg.Message = message;
  }


}
