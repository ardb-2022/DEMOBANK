import { ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild ,AfterViewInit} from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { SystemValues, mm_operation, p_report_param } from 'src/app/bank-resolver/Models';
import { tt_trial_balance } from 'src/app/bank-resolver/Models/tt_trial_balance';
import { RestService } from 'src/app/_service';
import Utils from 'src/app/_utility/utils';
import { PageChangedEvent } from "ngx-bootstrap/pagination/public_api";
import { ExportAsService, ExportAsConfig } from 'ngx-export-as'
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import { CommonServiceService } from 'src/app/bank-resolver/common-service.service';
import { mm_constitution } from 'src/app/bank-resolver/Models/deposit/mm_constitution';
import { mm_acc_type } from 'src/app/bank-resolver/Models/deposit/mm_acc_type';
@Component({
  selector: 'app-detail-list-introducer',
  templateUrl: './detail-list-introducer.component.html',
  styleUrls: ['./detail-list-introducer.component.css'],
  providers:[ExportAsService]

})

export class DetailListIntroducerComponent implements OnInit,AfterViewInit {
  @ViewChild('content', { static: true }) content: TemplateRef<any>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  dataSource = new MatTableDataSource()
  // displayedColumns: string[] = ['constitution_cd','acc_num','cust_name', 'opening_dt', 'mat_dt','instL_AMT','intT_RT','prN_AMT','proV_INTT_AMT'];
   displayedColumns: string[] = ['slNo','acc_num','cust_cd','cust_name', 'opening_dt', 'mat_dt','prn_amt','intt_amt','intro_name'];
   public static operations: mm_operation[] = [];
   AcctTypes: mm_acc_type[];
  modalRef: BsModalRef;
  isOpenFromDp = false;
  isOpenToDp = false;
  sys = new SystemValues();
  config = {
    keyboard: false, // ensure esc press doesnt close the modal
    backdrop: true, // enable backdrop shaded color
    ignoreBackdropClick: true // disable backdrop click to close the modal
  };
  
  constitutionList: mm_constitution[] = [];
  constitutionListToBind: mm_constitution[] = [];
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
  counter=0
  todate: Date;
  exportAsConfig:ExportAsConfig;
  itemsPerPage = 50;
  currentPage = 1;
  pagedItems = [];
  reportData:any=[]
  ardbName=localStorage.getItem('ardb_name')
  branchName=this.sys.BranchName
  filteredArray:any=[]
  filteredArray1:any=[];

  pageChange: any;
  suminstL_AMT=0;
  opcrSum=0;
  sumprN_AMT=0;
  sumproV_INTT_AMT=0;
  clsdrSum=0;
  clscrSum=0;
  lastAccCD:any;
  today:any
  pageLength=0;
  accType:any;
  selectAccType:any;
  ConstType:any;
  selectConstType:any;
    groupedData: any[] = [];
    filteredGroups: any[] = [];
    allIntros: string[] = [];
    grandTotalPrn = 0;
    grandTotalIntt = 0;
    searchText = '';
  constructor(private comSer:CommonServiceService,private svc: RestService, private formBuilder: FormBuilder,private exportAsService: ExportAsService,
              private modalService: BsModalService, private _domSanitizer: DomSanitizer,private cd: ChangeDetectorRef,
              private router: Router) { }
  ngOnInit(): void {
    this.fromdate = this.sys.CurrentDate;
    this.todate = this.sys.CurrentDate;
    this.reportcriteria = this.formBuilder.group({
      fromDate: [null, Validators.required],
      toDate: [null, null],
      acc_type_cd: [null, Validators.required],
      // constitution_cd: [{ disabled: true }, Validators.required]
    });
    // this.getOperationMaster()
    this.getAccountTypeList();
    this.onLoadScreen(this.content);
    var date = new Date();
    // get the date as a string
       var n = date.toDateString();
    // get the time as a string
       var time = date.toLocaleTimeString();
       this.today= n + " "+ time
       this.getConstitutionList();
  }
   getAccountTypeList() {
    
    this.AcctTypes = [];

    this.svc.addUpdDel<any>('Mst/GetAccountTypeMaster', null).subscribe(
      res => {

        this.AcctTypes = res;
        console.log(res);
        this.AcctTypes =this.AcctTypes.filter(e=>e.dep_loan_flag=='D')
        this.AcctTypes = this.AcctTypes.sort((a, b) => (a.acc_type_cd > b.acc_type_cd) ? 1 : -1);
        
       
      });
  }

  onLoadScreen(content) {
    this.modalRef = this.modalService.show(content, this.config);
    var date = new Date();
    // get the date as a string
       var n = date.toDateString();
    // get the time as a string
       var time = date.toLocaleTimeString();
       this.today= n + " "+ time
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
      this.modalRef.hide();
      this.sendData();
      this.fromdate = this.reportcriteria.controls.fromDate.value;
      this.reportData.length=0;
      this.pagedItems.length=0;
      this.modalRef.hide();
      this.isLoading=true;
      this.suminstL_AMT=0
      this.sumprN_AMT=0
      this.sumproV_INTT_AMT=0
      var dt={
      'ardb_cd' : this.sys.ardbCD,
      'brn_cd' : this.sys.BranchCode,
      'trial_dt' : this.fromdate.toISOString(),
      'acc_type_cd' : this.reportcriteria.controls.acc_type_cd.value,
      // 'const_cd' : this.reportcriteria.controls.constitution_cd.value,
      }
      this.svc.addUpdDel('Deposit/GetIntroRep',dt).subscribe(data=>{
        console.log(data)
        this.reportData=data
        if(!this.reportData){
          this.comSer.SnackBar_Nodata()
          this.isLoading=false
        } 
        else{
          for(let i=0;i<this.reportData.length;i++){
            // this.reportData[i].ardb_cd=i+1;
           this.reportData[i].opening_dt=this.comSer.getFormatedDate(this.reportData[i].opening_dt);
           this.reportData[i].mat_dt=this.comSer.getFormatedDate(this.reportData[i].mat_dt);
           }
        }
        this.pageLength=this.reportData.length
        this.dataSource.data=this.reportData
        this.isLoading=false
        this.createGroup(this.reportData);
        // this.lastcustcd=this.reportData[this.reportData.length-1].cust_cd
        // this.reportData.forEach(e=>{
        //   this.suminstL_AMT+=e.intt_amt
        //   this.sumprN_AMT+=e.prn_amt
         
        // })
      
      }),err => {
        this.isLoading = false;
        this.comSer.SnackBar_Error(); 
        
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
  sendData(){
    console.log(this.accType)
    this.accType=''
    this.accType=this.AcctTypes.filter(e=>e.acc_type_cd==(this.reportcriteria.controls.acc_type_cd.value.toString()))[0]?.acc_type_desc
   
    // this.accType=this.reportcriteria.controls.acc_type_cd.value == '2'?'Fixed Deposit':(this.reportcriteria.controls.acc_type_cd.value == '3'?'DBS':this.reportcriteria.controls.acc_type_cd.value == '4'?'Term Deposit':'MIS')
  //  this.ConstType=this.constitutionListToBind.filter(x=>x.constitution_cd=this.reportcriteria.controls.constitution_cd.value)
  //  this.selectConstType=this.ConstType.constitution_desc
  //  this.selectAccType=this.accType;
  //  console.log(this.ConstType,this.selectAccType,this.selectConstType);
   
  }
  getConstitutionList() {
    if (undefined !== this.constitutionList &&
      null !== this.constitutionList &&
      this.constitutionList.length > 0) {
      return;
    }

    this.constitutionList = [];
    this.svc.addUpdDel<any>('Mst/GetConstitution', null).subscribe(
      res => {
        this.constitutionList = Utils.ChkArrNotEmptyRetrnEmptyArr(res);
      },
      err => { // ;
      }
    );
  }
  public onAccountTypeChange(): void {
    this.constitutionListToBind = null;
    this.reportcriteria.controls.constitution_cd.reset();
    if (+this.reportcriteria.controls.acc_type_cd.value > 0) {
      this.constitutionListToBind = this.constitutionList.filter(e =>
        e.acc_type_cd === (+this.reportcriteria.controls.acc_type_cd.value));
      this.reportcriteria.controls.constitution_cd.enable();
    }
  }
  closeScreen() {
    this.router.navigate([this.sys.BankName + '/la']);
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
      elementIdOrContent:'trial111'
    }
    this.exportAsService.save(this.exportAsConfig, 'DL_introducerWise').subscribe(() => {
      // save started
      console.log("hello")
    });
  }
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
  applyFilter1(event:Event){
    const filterValue=(event.target as HTMLInputElement).value
    // this.bName=(event.target as HTMLInputElement).value
    this.filteredArray=this.reportData
    console.log(filterValue)
    console.log(
      this.filteredArray.filter(e=>e.cust_name?.toLowerCase()==filterValue.toLowerCase())
    )
    if(filterValue.length>0){
      this.filteredArray1=this.filteredArray.filter(e=>e.cust_name?.toLowerCase()==(filterValue.toLowerCase())==true)
      console.log(this.filteredArray1)
      this.dataSource.data=this.filteredArray1
      this.getTotal()
    }
    else{
      this.dataSource.data=this.reportData
      this.getTotal()
    }
    

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
    this.suminstL_AMT=0
    this.sumprN_AMT=0
    this.sumproV_INTT_AMT=0
    console.log(this.dataSource.filteredData)
    this.filteredArray=this.dataSource.filteredData
    for(let i=0;i<this.filteredArray.length;i++){
      this.suminstL_AMT+=this.filteredArray[i].intt_amt
      this.sumprN_AMT+=this.filteredArray[i].prn_amt
      // console.log(this.filteredArray[i].dr_amt)
    
      // this.crSum+=this.filteredArray[i].cr_amount
    }
  }
  createGroup(data){
    const groups = data.reduce((acc, row) => {
    if (!acc[row.intro_name]) {
      acc[row.intro_name] = [];
    }
    acc[row.intro_name].push(row);
    return acc;
  }, {} as { [key: string]: any[] });

  this.groupedData = Object.keys(groups).map(intro => {
    const rows = groups[intro];
    const totalPrn = rows.reduce((sum, r) => sum + r.prn_amt, 0);
    const totalIntt = rows.reduce((sum, r) => sum + r.intt_amt, 0);

    this.grandTotalPrn += totalPrn;
    this.grandTotalIntt += totalIntt;

    return { intro, rows, totalPrn, totalIntt };
  });

  this.filteredGroups = [...this.groupedData]; // default show all
  this.allIntros = this.groupedData.map(g => g.intro); // list for autocomplete

  }
  filterGroups() {
  if (this.searchText && this.searchText.trim() !== '') {
    this.filteredGroups = this.groupedData.filter(g =>
      g.intro.toLowerCase().includes(this.searchText.toLowerCase())
    );
  } else {
    this.filteredGroups = [...this.groupedData];
  }
}

}
