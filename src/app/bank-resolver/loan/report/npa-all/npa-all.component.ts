import { ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild ,AfterViewInit, ElementRef} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { SystemValues, mm_customer, p_report_param, mm_operation } from 'src/app/bank-resolver/Models';
import { tt_trial_balance } from 'src/app/bank-resolver/Models/tt_trial_balance';
import { RestService } from 'src/app/_service';
import { PageChangedEvent } from "ngx-bootstrap/pagination/public_api";
import { ExportAsService, ExportAsConfig } from 'ngx-export-as'
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import { CommonServiceService } from 'src/app/bank-resolver/common-service.service';
import html2canvas from 'html2canvas';
import jspdf from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
@Component({
  selector: 'app-npa-all',
  templateUrl: './npa-all.component.html',
  styleUrls: ['./npa-all.component.css']
})
export class NpaALLComponent implements OnInit {

  public static operations: mm_operation[] = [];
  @ViewChild('mattable') htmlData:ElementRef;
  @ViewChild('content', { static: true }) content: TemplateRef<any>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  dataSource = new MatTableDataSource()
  displayedColumns: string[] = ['block_name','activity','acc_desc','loan_id','party_name','disb_dt','disb_amt', 'prn_due', 'intt_due','npa_dt','ovd_prn','ovd_intt','penal_intt','stan_prn','substan_prn','d1_prn','d2_prn','d3_prn','totalNPA','provision'];
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

  AcctTypes: mm_operation[];
  prp = new p_report_param();
  reportcriteria: FormGroup;
  closeResult = '';
  showReport = false;
  showAlert = false;
  isLoading = false;
  ReportUrl: SafeResourceUrl;
  UrlString = '';
  alertMsg = '';
  counter=0;
  fd: any;
  td: any;
  dt: any;
  fromdate: Date;
  // todate: Date;
  exportAsConfig:ExportAsConfig;
  itemsPerPage = 50;
  currentPage = 1;
  pagedItems = [];
  reportData:any=[]
  filteredArray:any=[];
  today:any
  ardbName=localStorage.getItem('ardb_name')
  branchName=this.sys.BranchName
  npaData: any[] = [];  // Load from API or static
  branchData: any[] = [];  // Load from API or static
  loanTypeData: any[] = [];  // Load from API or static

  groupedData: any[] = [];
  grandTotal: any = {
  disb_amt: 0,
  outstanding_prn: 0,
  curr_prn:0,
  ovd_prn: 0,
  ovd_intt: 0,
  standard: 0,
  sma0: 0,
  sma1: 0,
  sma2: 0,
  sub_standard: 0,
  doubtful1: 0,
  doubtful2: 0,
  doubtful3: 0
};
  selectedBranch: string = '';
  selectedLoan: string = '';
 headers = [
  { label: 'Branch Code', key: 'brn_cd' },
  { label: 'Account Code', key: 'acc_cd' },
  { label: 'Loan ID', key: 'loan_id' },
  { label: 'Customer Name', key: 'cust_name',  width: '350px'},
  { label: 'Disbursed Amount', key: 'disb_amt', isAmount: true },
  { label: 'Disb Date', key: 'disb_dt', isDate: true },
  { label: 'Installment Start Date', key: 'instl_start_dt', isDate: true },
  { label: 'Installment No', key: 'instl_no' },
  { label: 'Periodicity', key: 'periodicity' },
  { label: 'EMI Prn', key: 'emi', isAmount: true },
  
  { label: 'Outstanding Balance', key: 'outstanding_prn', isAmount: true },
  { label: 'Current Principal', key: 'curr_prn', isAmount: true },
  { label: 'Overdue Principal', key: 'ovd_prn', isAmount: true },
  { label: 'Overdue Interest', key: 'ovd_intt', isAmount: true },
  { label: 'Interest Capitalised', key: 'intt_capitalised', isAmount: true },
  // { label: 'EMI %', key: 'emi_perc', isAmount: true },
  { label: 'NPA Date', key: 'npa_dt', isDate: true },
  { label: 'Default Days', key: 'default_days' },
  { label: 'Gross NPA', key: 'gross_npa', isAmount: true },
  { label: 'Secured Amount', key: 'secured_amt', isAmount: true },
  { label: 'Unsecured Amount', key: 'unsecured_amt', isAmount: true },
  { label: 'Standard', key: 'standard', isAmount: true },
  { label: 'SMA 0', key: 'sma0', isAmount: true },
  { label: 'SMA 1', key: 'sma1', isAmount: true },
  { label: 'SMA 2', key: 'sma2', isAmount: true },
  { label: 'Sub Standard', key: 'sub_standard', isAmount: true },
  { label: 'Doubtful 1', key: 'doubtful1', isAmount: true },
  { label: 'Doubtful 2', key: 'doubtful2', isAmount: true },
  { label: 'Doubtful 3', key: 'doubtful3', isAmount: true },
  { label: 'Loss Asset', key: 'loss_asset', isAmount: true },
  { label: 'Provision %', key: 'prov_perc', isAmount: true },
  { label: 'Provision Amount', key: 'prov_amt', isAmount: true },
  { label: 'Agent Code', key: 'agent_cd',width: '350px' }
  ];
  filters = {
    standard: false,
    sma0: false,
    sma1: false,
    sma2: false,
    sub_standard: false,
    doubtful1: false,
    doubtful2: false,
    doubtful3: false
  };

  filteredData: any[] = [];
  overallGrandTotal: any = {};
  constructor(private svc: RestService, private formBuilder: FormBuilder,
    private modalService: BsModalService,private exportAsService: ExportAsService, private cd: ChangeDetectorRef,
    private router: Router, private comSer:CommonServiceService) { }
  ngOnInit(): void {
    // this.isLoading=true;
    this.fromdate = this.sys.CurrentDate;
    this.reportcriteria = this.formBuilder.group({
      fromDate: [null, Validators.required],
    });
    this.getAccountTypeList();
    this.getBranchList();
    this.onLoadScreen(this.content);
    var date = new Date();
    var n = date.toDateString();
    var time = date.toLocaleTimeString();
    this.today= n + " "+ time
  }
 onLoadScreen(content) {
    this.modalRef = this.modalService.show(content, this.config);
  }
  
  getAccountTypeList() {

    if (this.loanTypeData.length > 0) {
      return;
    }
    this.loanTypeData = [];

    this.isLoading = true;
    this.svc.addUpdDel<any>('Mst/GetAccountTypeMaster', null).subscribe(
      res => {

        this.isLoading = false;
        this.loanTypeData = res;
        this.loanTypeData = this.loanTypeData.filter(c => c.dep_loan_flag === 'L');
        this.loanTypeData = this.loanTypeData.sort((a, b) => (a.acc_type_cd > b.acc_type_cd) ? 1 : -1);
      },
      err => {
        this.isLoading = false;
      }
    );
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

  public SubmitReport() {
    if (this.reportcriteria.invalid) {
      this.showAlert = true;
      this.alertMsg = 'Invalid Input.';
      return false;
    }
    else {
      this.reportData=[];
      this.modalRef.hide();
      this.isLoading=true;
      this.fromdate = this.reportcriteria.controls.fromDate.value;
      var dt={
        // "ardb_cd":this.sys.ardbCD,
        // "brn_cd":this.sys.BranchCode,
        // "acc_cd":this.reportcriteria.controls.acc_type_cd.value,
        "to_dt":this.fromdate.toISOString(),
        // "fund_type":this.reportcriteria.controls.fType.value
      }
      this.svc.addUpdDel<any>('Loan/GetNPAData',dt).subscribe(data=>{console.log(data)
        // this.reportData=data
         if(!data){
          this.comSer.SnackBar_Nodata()
          this.isLoading=false
        }
        else{
          this.npaData=data;
          if(this.npaData){
             this.applyFilters();
          }
          this.isLoading=false
          this.modalRef.hide();
       
        }
      })
    }
  }

//  applyFilters(): void {
//     let filtered = [...this.npaData];

//     if (this.selectedBranch) {
//       filtered = filtered.filter(x => x.brn_cd === this.selectedBranch);
//       this.branchName = this.branchData.find(b => b.brn_cd === this.selectedBranch)?.brn_name ?? '';
//     } else {
//       this.branchName = 'All Branches';
//     }

//     if (this.selectedLoan) {
//       filtered = filtered.filter(x => x.acc_cd === +this.selectedLoan);
//     }

//     this.groupedData = this.groupData(filtered);
//     this.grandTotal = this.calculateTotal(filtered);
//   }
  applyFilters(): void {
  let filtered = [...this.npaData];

  // Branch filter
  if (this.selectedBranch) {
    filtered = filtered.filter(x => x.brn_cd === this.selectedBranch);
    this.branchName = this.branchData.find(b => b.brn_cd === this.selectedBranch)?.brn_name ?? '';
  } else {
    this.branchName = 'All Branches';
  }

  // Loan Type filter
  if (this.selectedLoan) {
    filtered = filtered.filter(x => x.acc_cd === +this.selectedLoan);
  }

  // Extra condition filters (checkboxes)
  if (this.filters.standard) {
    filtered = filtered.filter(x => x.standard > 0);
  }
  if (this.filters.sma0) {
    filtered = filtered.filter(x => x.sma0 > 0);
  }
  if (this.filters.sma1) {
    filtered = filtered.filter(x => x.sma1 > 0);
  }
  if (this.filters.sma2) {
    filtered = filtered.filter(x => x.sma2 > 0);
  }
  if (this.filters.sub_standard) {
    filtered = filtered.filter(x => x.sub_standard > 0);
  }
  if (this.filters.doubtful1) {
    filtered = filtered.filter(x => x.doubtful1 > 0);
  }
  if (this.filters.doubtful2) {
    filtered = filtered.filter(x => x.doubtful2 > 0);
  }
  if (this.filters.doubtful3) {
    filtered = filtered.filter(x => x.doubtful3 > 0);
  }

  // Update grouped data and totals
  this.groupedData = this.groupData(filtered);
  this.grandTotal = this.calculateTotal(filtered);
}
    resetFilters(): void {
      this.selectedBranch = '';
      this.selectedLoan = '';
      this.branchName = 'All Branches';
      this.filters = {
        standard: false,
        sma0: false,
        sma1: false,
        sma2: false,
        sub_standard: false,
        doubtful1: false,
        doubtful2: false,
        doubtful3: false
      };

      this.groupedData = this.groupData(this.npaData);
      this.grandTotal = this.calculateTotal(this.npaData);
    }
  groupData(data: any[]): any[] {
    const branchMap = new Map<string, any>();

    data.forEach(item => {
      if (!branchMap.has(item.brn_cd)) {
        branchMap.set(item.brn_cd, {
          brn_cd: item.brn_cd,
          brn_name: item.brn_name,
          groups: [],
          total: this.initializeTotals()
        });
      }

      const branch = branchMap.get(item.brn_cd);

      let group = branch.groups.find((g: any) => g.acc_cd === item.acc_cd);
      if (!group) {
        group = {
          acc_cd: item.acc_cd,
          acc_desc: item.acc_desc,
          data: [],
          total: this.initializeTotals()
        };
        branch.groups.push(group);
      }

      group.data.push(item);
      this.addToTotal(group.total, item);
      this.addToTotal(branch.total, item);
    });

    return Array.from(branchMap.values());
  }

  initializeTotals(): any {
    return {
      disb_amt: 0,  outstanding_prn: 0,curr_prn: 0, ovd_prn: 0,ovd_intt: 0, standard: 0,
      sma0: 0, sma1: 0, sma2: 0, sub_standard: 0,
      doubtful1: 0, doubtful2: 0, doubtful3: 0, intt_capitalised: 0
    };
  }

  addToTotal(total: any, item: any): void {
    total.disb_amt += +item.disb_amt || 0;
    total.outstanding_prn += +item.outstanding_prn || 0;
    total.curr_prn += +item.curr_prn || 0;
    total.ovd_prn += +item.ovd_prn || 0;
    total.ovd_intt += +item.ovd_intt || 0;
    total.standard += +item.standard || 0;
    total.sma0 += +item.sma0 || 0;
    total.sma1 += +item.sma1 || 0;
    total.sma2 += +item.sma2 || 0;
    total.sub_standard += +item.sub_standard || 0;
    total.doubtful1 += +item.doubtful1 || 0;
    total.doubtful2 += +item.doubtful2 || 0;
    total.doubtful3 += +item.doubtful3 || 0;
    total.intt_capitalised += +item.intt_capitalised || 0;
  }

  calculateTotal(data: any[]): any {
    const total = this.initializeTotals();
    data.forEach(item => this.addToTotal(total, item));
    return total;
  }

getBranchName(brn_cd: string): string {
  const branch = this.branchData.find(b => b.brn_cd === brn_cd);
  return branch ? branch.brn_name : brn_cd;
}

getLoanTypeName(acc_cd: number): string {
  const loan = this.loanTypeData.find(l => l.acc_type_cd === acc_cd);
  return loan ? loan.acc_type_desc : acc_cd.toString();
}




//     applyFilters(): void {
//     let filtered = [...this.npaData];
//     if (this.selectedBranch) {
//       filtered = filtered.filter(d => d.brn_cd === this.selectedBranch);
//     }
//     if (this.selectedLoan) {
//       filtered = filtered.filter(d => d.acc_cd === +this.selectedLoan);
//     }
//     this.groupNPAData(filtered);
//   }
//  groupNPAData(data: any[]) {
//     const branchMap = new Map(this.branchData.map(b => [b.brn_cd, b.brn_name]));
//     const loanMap = new Map(this.loanTypeData.map(l => [l.acc_type_cd, l.acc_type_desc]));
//     const grouped: any[] = [];

//     const branchGroups = data.reduce((acc, item) => {
//       const brn = item.brn_cd;
//       const accCd = item.acc_cd;
//       if (!acc[brn]) acc[brn] = {};
//       if (!acc[brn][accCd]) acc[brn][accCd] = [];
//       acc[brn][accCd].push(item);
//       return acc;
//     }, {});

//     for (const brn_cd in branchGroups) {
//       const branch = {
//         brn_cd,
//         brn_name: branchMap.get(brn_cd) || brn_cd,
//         groups: []
//       };

//       for (const acc_cd in branchGroups[brn_cd]) {
//         const records = branchGroups[brn_cd][acc_cd];
//         const total = records.reduce((t, r) => {
//           t.disb_amt += r.disb_amt;
//           t.outstanding_prn += r.outstanding_prn;
//           t.intt_capitalised += r.intt_capitalised;
//           return t;
//         }, { disb_amt: 0, outstanding_prn: 0, intt_capitalised: 0 });

//         branch.groups.push({
//           acc_cd,
//           acc_desc: loanMap.get(+acc_cd) || acc_cd,
//           data: records,
//           total
//         });
//       }

//       grouped.push(branch);
//     }

//     this.groupedData = grouped;
//   }

  // exportToExcel(): void {
  //   const exportData = this.groupedData.flatMap(branch =>
  //     branch.groups.flatMap(group =>
  //       group.data.map(row => {
  //         const flat = {
  //           Branch: branch.brn_name,
  //           LoanType: group.acc_desc,
  //         };
  //         this.headers.forEach(h => {
  //           flat[h.label] = row[h.key];
  //         });
  //         return flat;
  //       })
  //     )
  //   );

  //   const worksheet = XLSX.utils.json_to_sheet(exportData);
  //   const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
  //   const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  //   FileSaver.saveAs(new Blob([excelBuffer]), 'NPA-Report.xlsx');
  // }

  // exportToPDF(): void {
  //   const doc = new jsPDF('l', 'pt', 'a3');

  //   this.groupedData.forEach(branch => {
  //     doc.text(`Branch: ${branch.brn_name}`, 20, doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 30 : 30);

  //     branch.groups.forEach(group => {
  //       autoTable(doc, {
  //         head: [this.headers.map(h => h.label)],
  //         body: group.data.map(d => this.headers.map(h => d[h.key])),
  //         startY: doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 20 : 40,
  //         theme: 'grid',
  //         styles: { fontSize: 8 }
  //       });

  //       autoTable(doc, {
  //         head: [[
  //           '', '', '', 'Total', group.total.disb_amt, '', '', '', '', group.total.outstanding_prn, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', group.total.intt_capitalised, ''
  //         ]],
  //         startY: doc.lastAutoTable.finalY + 5,
  //         theme: 'plain'
  //       });
  //     });
  //   });

  //   doc.save('NPA-Report.pdf');
  // }

  public closeAlert() {
    this.showAlert = false;
  }
 
  closeScreen() {
    this.router.navigate([this.sys.BankName + '/la']);
  }
  ngAfterViewInit() {
    // this.dataSource.paginator = this.paginator;
    // this.dataSource.sort = this.sort;
  }

  // applyFilter(event: Event) {
  //   const filterValue = (event.target as HTMLInputElement).value;
  //   this.dataSource.filter = filterValue.trim().toLowerCase();

  //   if (this.dataSource.paginator) {
  //     this.dataSource.paginator.firstPage();
  //   }
  //   this.getTotal()
    
  // }

  downloadexcel2(){
    this.exportAsConfig = {
      type: 'xlsx',
      // elementId: 'hiddenTab', 
      elementIdOrContent:'mattable'
    }
    this.exportAsService.save(this.exportAsConfig, 'NPAListAll').subscribe(() => {
      // save started
      console.log("hello")
    });
  }
  openPDF(): void {
    const div = document.getElementById('mattable');
    div.style.width = "fit-content";
    html2canvas(div, {
      scale: 2, // Increase the scale to improve the quality
      scrollX: -window.scrollX, // Fix the position on the x-axis
      scrollY: -window.scrollY, // Fix the position on the y-axis
    }).then(canvas => {
      const pdf = new jspdf('landscape', 'pt');
      const width = 2000;
      const height = 1300;
      const ratio = width / height;
      const pageWidth =840;
      // pdf.internal.pageSize.getWidth()
      const pageHeight = pageWidth / ratio;
      pdf.addImage(canvas, 'PNG', 0, 0, pageWidth, pageHeight);
      pdf.save('my-document.pdf');
    });
  }
  downloadexcel(): void {
  // Define the columns order
  const headers = [
    "Branch Code", "Account Code", "Loan ID", "Customer Name", "Disbursed Amount",
    "Disb Date", "Installment Start Date", "Installment No", "Periodicity", "EMI Prn",
    "Outstanding Principal", "Current Principal","Overdue Principal","Overdue Interest", "Interest Capitalised", 
    "NPA Date", "Default Days", "Gross NPA", "Secured Amount", "Unsecured Amount",
    "Standard", "SMA 0", "SMA 1", "SMA 2", "Sub Standard", "Doubtful 1",
    "Doubtful 2", "Doubtful 3", "Loss Asset", "Provision %", "Provision Amount",
    "Agent Code"
  ];

  // Map data into row objects
  const worksheetData = this.npaData.map(item => ({
    "Branch Code": item.brn_cd,
    "Account Code": item.acc_cd,
    "Loan ID": item.loan_id,
    "Customer Name": item.cust_name,
    "Disbursed Amount": item.disb_amt,
    "Disb Date": item.disb_dt?.substr(0,10),
    "Installment Start Date": item.instl_start_dt?.substr(0,10),
    "Installment No": item.instl_no,
    "Periodicity": item.periodicity,
    "EMI Prn": item.emi,
    "Outstanding Principal": item.outstanding_prn,
    "Current Principal": item.curr_prn,
    "Overdue Principal": item.ovd_prn,
    "Overdue interest": item.ovd_intt,
    "Interest Capitalised": item.intt_capitalised,
    // "EMI %": item.emi_perc,
    "NPA Date": item.npa_dt?.substr(0,10),
    "Default Days": item.default_days,
    "Gross NPA": item.gross_npa,
    "Secured Amount": item.secured_amt,
    "Unsecured Amount": item.unsecured_amt,
    "Standard": item.standard,
    "SMA 0": item.sma0,
    "SMA 1": item.sma1,
    "SMA 2": item.sma2,
    "Sub Standard": item.sub_standard,
    "Doubtful 1": item.doubtful1,
    "Doubtful 2": item.doubtful2,
    "Doubtful 3": item.doubtful3,
    "Loss Asset": item.loss_asset,
    "Provision %": item.prov_perc,
    "Provision Amount": item.prov_amt,
    "Agent Code": item.agent_cd
  }));

  // Add headers as first row
  const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(worksheetData, { header: headers });

  // Create workbook
  const workbook: XLSX.WorkBook = { Sheets: { 'NPA Report': worksheet }, SheetNames: ['NPA Report'] };
  const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';

  // Save to Excel
  const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const data: Blob = new Blob([excelBuffer], { type: EXCEL_TYPE });
  saveAs(data, 'NPA_AllReport.xlsx');
}

// Excel MIME type
// const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';

}
