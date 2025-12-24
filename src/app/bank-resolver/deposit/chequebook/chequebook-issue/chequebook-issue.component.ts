import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { RestService } from 'src/app/_service';
import { LOGIN_MASTER, MessageType, ShowMessage, SystemValues, mm_dist } from '../../../Models';
import { m_branch } from '../../../Models/m_branch';
import { Subject, takeUntil, combineLatest } from 'rxjs';
import { ChequeBookService } from './chequebook.service';
import { ChequeBook, Cheque, AccountInfo, AccountType } from '../../../Models/deposit/chequeBook';
import { p_gen_param } from 'src/app/bank-resolver/Models/p_gen_param';


@Component({
  selector: 'app-chequebook-issue',
  templateUrl: './chequebook-issue.component.html',
  styleUrls: ['./chequebook-issue.component.scss']
})
export class ChequebookIssueComponent implements OnInit,OnDestroy {

 
  sys = new SystemValues()
  isLoading=false;
  agentForm: FormGroup;
  showMsg: ShowMessage;
  chequeForm: FormGroup;
  chequeBook: ChequeBook | null = null;
  cheques: Cheque[] = [];
  accounts: AccountInfo[] = [];
  accountTypes: AccountType[] = [];
  selectedAccount: string = '';
  isModifyMode: boolean = false;
  isNewMode: boolean = true;
  
  private destroy$ = new Subject<void>();


  constructor(private router: Router,private svc: RestService, private fb: FormBuilder, private chequeBookService: ChequeBookService) { 
     this.initializeForm();
  }
  // @ViewChild('contentbatch', { static: true }) contentbatch: TemplateRef<any>;
  // modalRef: BsModalRef;

  ngOnInit(): void {
    // this.handleNew();
    // this.handleAction('new');
    // this.initializeForm();
    this.loadAccountTypes();
    // this.loadAccounts();
    // this.subscribeToServices();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  get freshCheques(): any[] {
    return this.cheques.filter(c => c.chq_status === 'I');
  }

  get usedCheques(): any[] {
    return this.cheques.filter(c => c.chq_status === 'U');
  }
  private initializeForm(): void {
      let dateObj = localStorage.getItem('__currentDate');
      let [day, month, year] = dateObj.split('/');
      let formattedDate = `${year}-${month}-${day}`;
      console.log(formattedDate);
    this.chequeForm = this.fb.group({
      acc_type_cd: [1, [Validators.required, Validators.min(1)]],
      acc_name:[''],
      acc_num: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
      chq_bk_no: [''],
      issue_dt: [formattedDate, Validators.required],
      chq_no_from: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
      chq_no_to: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
      approval_status: ['U', Validators.required],
      created_by: [this.sys.UserId, Validators.required],
      approved_by: ['UNKNOWN'],
      chq_version: [2, [Validators.required, Validators.min(1)]]
    });

// Assign to the date input model
    this.chequeForm.controls.issue_dt.disable();
    this.chequeForm.controls.approval_status.disable();
    this.chequeForm.controls.created_by.disable();
    this.chequeForm.controls.approved_by.disable();
    this.chequeForm.controls.chq_bk_no.disable();
    // Disable form initially
    // this.chequeForm.disable();
  }



  private loadAccountTypes(): void {
    this.accountTypes = this.chequeBookService.getAccountTypes();
  }

  private loadAccounts(): void {
    this.chequeBookService.accounts$
      .pipe(takeUntil(this.destroy$))
      .subscribe(accounts => {
        this.accounts = accounts;
        if (accounts.length > 0) {
          // this.selectAccount(accounts[0].acc_num);
        }
      });
  }

  private subscribeToServices(): void {
    combineLatest([
      this.chequeBookService.chequeBook$,
      this.chequeBookService.cheques$
    ])
    .pipe(takeUntil(this.destroy$))
    .subscribe(([chequeBook, cheques]) => {
      this.chequeBook = chequeBook;
      this.cheques = cheques;
      
      if (chequeBook) {
        // this.populateForm(chequeBook);
      }
    });
  }

  private populateForm(chequeBook: ChequeBook): void {
    
    this.chequeForm.patchValue({
      acc_type_cd: chequeBook.acc_type_cd,
      acc_num: chequeBook.acc_num,
      acc_name:chequeBook.acc_name,
      chq_bk_no: chequeBook.chq_bk_no,
      issue_dt: this.formatDateForInput(chequeBook.issue_dt),
      chq_no_from: chequeBook.chq_no_from,
      chq_no_to: chequeBook.chq_no_to,
      approval_status: chequeBook.approval_status,
      created_by: chequeBook.created_by,
      approved_by: chequeBook.approved_by?chequeBook.approved_by:'UNKNOWN',
      chq_version: chequeBook.chq_version
    });
     this.chequeForm.disable();
  }

  // private formatDateForInput(date: Date): string {
  //   if (!date) return '';
  //   const d = new Date(date);
  //   if(d.toISOString().includes('T')){
  //   return d.toISOString().split('T')[0];

  //   }
  //   else{
  //     const parts = date.toISOString().split(" ")[0].split("/"); // ["01","08","2022"]
  //     const formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`; // "2022-08-01"
  //     return formattedDate
  //   }
  // }
 formatDateForInput(dateVal: string | Date): string {
  if (!dateVal) return '';

  let jsDate: Date;

  if (dateVal instanceof Date) {
    jsDate = dateVal;
  } else {
    const [day, month, year] = dateVal.split(' ')[0].split('/');
    jsDate = new Date(Number(year), Number(month) - 1, Number(day));
  }

  // Format manually in local time
  const yyyy = jsDate.getFullYear();
  const mm = String(jsDate.getMonth() + 1).padStart(2, '0');
  const dd = String(jsDate.getDate()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd}`;
}
  parseDate(dateVal: string | Date): Date {
  if (!dateVal) return null;

  if (dateVal instanceof Date) {
    return dateVal;
  }

  const [day, month, year] = dateVal.split(' ')[0].split('/');
  const [hour, minute] = dateVal.split(' ')[1]?.split(':') ?? ['0', '0'];

  return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
}
  getAccHolderName(){
        this.isLoading=true;
        const prm = new p_gen_param();
        prm.ad_acc_type_cd = (+this.chequeForm.controls.acc_type_cd.value);
        prm.as_cust_name = this.chequeForm.controls.acc_num.value;
        this.svc.addUpdDel<any>(this.chequeForm.controls.acc_type_cd.value==23115?'Loan/GetLoanDtls1':'Deposit/GetAccDtls', prm).subscribe(
          res => {
            if (undefined !== res && null !== res && res.length > 0) {
              if(res[0]?.acc_num==this.chequeForm.controls.acc_num.value || res[0]?.loan_id==this.chequeForm.controls.acc_num.value){
              this.chequeForm.controls.acc_name.setValue(res[0]?.cust_name);
              this.getChequeDtls(+this.chequeForm.controls.acc_type_cd.value,res[0].acc_num?res[0].acc_num:res[0].loan_id);
              }else{
                this.HandleMessage(true, MessageType.Error, 'No Account Found');
              }
              console.log(res);
              this.isLoading = false;
            } else {
              console.log(res);

               this.HandleMessage(true, MessageType.Error, 'No Account Found');
              this.isLoading = false;
            }
          },
          
  
          err => {  
            console.log(err);
            this.isLoading = false; }
        );    
  }

  getChequeDtls(acc_cd,acc_num){
        this.isLoading=true;
        const payload={
          "acc_type_cd":+acc_cd,
          "as_acc_num":acc_num
        }
        this.svc.addUpdDel<any>('Deposit/GetChqDtls', payload).subscribe(
          res => {
            if (undefined !== res && null !== res && res.length > 0) {
              console.log(res);
              res.forEach(e=>e.acc_name=this.chequeForm.controls.acc_name.value);
              this.accounts=[...res]
              this.isLoading = false;
            } else {
              console.log(res);

               this.HandleMessage(true, MessageType.Error, 'No Cheque Details Found');
              this.isLoading = false;
              // this.suggestedCustomer = [];
            }
            // this.showWait=false
          },
          
  
          err => {  
            console.log(err);
            this.isLoading = false; }
        );    
  }
  getChequeData(acc_cd,acc_num,cb_no){
        this.isLoading=true;
        const payload={
          "acc_type_cd":acc_cd,
          "acc_num":acc_num,
          "chq_bk_no":cb_no
        }
        this.svc.addUpdDel<any>('Deposit/GetChqIssueData', payload).subscribe(
          res => {
            if (undefined !== res && null !== res && res.length > 0) {
              console.log(res);
              // this.cheques=[...res]
              this.isLoading = false;
            } else {
              console.log(res);

               this.HandleMessage(true, MessageType.Error, 'No Cheque Data Found');
              this.isLoading = false;
              // this.suggestedCustomer = [];
            }
            // this.showWait=false
          },
          
  
          err => {  
            console.log(err);
            this.isLoading = false; }
        );    
  }
  selectAccount(cheque: ChequeBook): void {
    this.subscribeToServices();
    this.populateForm(cheque);
    // this.selectedAccount = acc_num;
    this.chequeBookService.getChequeBook(cheque)
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }
  getAccountTypeName(code: number): string {
    return this.chequeBookService.getAccountTypeName(code);
  }

  // Action Handlers
  handleAction(action: string): void {
    switch (action) {
      case 'new':
        this.handleNew();
        break;
      case 'save':
        this.handleSave();
        break;
      case 'approve':
        this.handleApprove();
        break;
      case 'modify':
        this.handleModify();
        break;
      case 'retrieve':
        this.handleRetrieve();
        break;
      case 'back':
        this.handleBack();
        break;
      case 'delete':
        this.handleDelete();
        break;
    }
  }

  private handleNew(): void {
    let dateObj = localStorage.getItem('__currentDate');
      let [day, month, year] = dateObj.split('/');
      let formattedDate = `${year}-${month}-${day}`;
      console.log(formattedDate);
      this.isNewMode = true;
      // this.isModifyMode = true;
      this.chequeForm.enable();
      
      this.accounts=[];
      this.cheques=[];
       this.chequeBook = null
      this.chequeForm.reset({
        acc_type_cd: 1,
        approval_status: 'U',
        approved_by: 'UNKNOWN',
        created_by: this.sys.UserId,
        chq_version: 3,
        issue_dt: formattedDate
      });
      this.chequeForm.controls.issue_dt.disable();
      this.chequeForm.controls.approval_status.disable();
      this.chequeForm.controls.created_by.disable();
      this.chequeForm.controls.approved_by.disable();
      this.chequeForm.controls.chq_bk_no.disable();
      // this.showNotification('New cheque book mode enabled', 'info');
    
  }

  private handleSave(): void {
    if (this.chequeForm.valid) {
      const formValue = this.chequeForm.getRawValue();
      
      const chequeBookData: ChequeBook = {
        acc_type_cd: formValue.acc_type_cd,
        acc_num: formValue.acc_num,
        acc_name:formValue.acc_name,
        chq_bk_no: '',
        issue_dt: new Date(formValue.issue_dt),
        chq_no_from: formValue.chq_no_from,
        chq_no_to: formValue.chq_no_to,
        approval_status: 'U',
        created_by: formValue.created_by,
        created_dt: this.chequeBook?.created_dt || new Date(),
        approved_by: '',
        brn_cd: '',
        approved_dt: this.chequeBook?.approved_dt || null,
        chq_version: formValue.chq_version
      };

      const saveObservable =  this.chequeBookService.saveChequeBook(chequeBookData)


      saveObservable
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (saved) => {
            this.HandleMessage(true, MessageType.Sucess, 'New Cheque saved successfully');
            // this.showNotification('Data saved successfully!', 'success');
            // this.isModifyMode = false;
            // this.isNewMode = false;
            // this.chequeForm.disable();
            this.getChequeDtls(formValue.acc_type_cd,formValue.acc_num);
            // Generate cheques for new cheque book
            // if (this.isNewMode) {
            //   const newCheques = this.chequeBookService.generateChequeRange(
            //     chequeBookData.chq_no_from, 
            //     chequeBookData.chq_no_to
            //   );
              // Update cheques subject
            // }
          },
          error: (error) => {
            this.HandleMessage(true, MessageType.Error, 'Error saving data');
            console.error('Save error:', error);
          }
        });
    } else {
      this.HandleMessage(true, MessageType.Warning, 'Please fill all required fields correctly');
      this.markFormGroupTouched();
    }
  }

  private handleApprove(): void {
    if (this.chequeBook) {
      this.chequeBookService.ApproveChequeData(this.chequeBook)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (approved) => {
            console.log(approved);
            
            debugger
            this.getChequeDtls(this.chequeBook.acc_type_cd,this.chequeBook.acc_num)
            this.selectAccount(this.chequeBook);
            this.chequeForm.controls.approval_status.setValue('A');
            this.chequeForm.controls.approved_by.setValue(this.sys.UserId);
            this.HandleMessage(true, MessageType.Sucess, 'Cheque book approved successfully');
          },
          error: (error) => {
            this.HandleMessage(true, MessageType.Error, 'Error approving cheque book');
            console.error('Approve error:', error);
          }
        });
    }
  }

  private handleModify(): void {
    this.isModifyMode = true;
    this.chequeForm.enable();
    // Keep certain fields readonly
    this.chequeForm.get('created_by')?.disable();
    this.chequeForm.get('approved_by')?.disable();
    this.showNotification('Modify mode enabled', 'info');
  }

  private handleRetrieve(): void {
    // if (this.selectedAccount) {
    //   this.chequeBookService.getChequeBook(this.selectedAccount)
    //     .pipe(takeUntil(this.destroy$))
    //     .subscribe(() => {
    //       this.showNotification('Data retrieved successfully', 'info');
    //     });
    // }
  }

  private handleBack(): void {
    this.chequeForm.reset();
     this.closeScreen();
    this.chequeBook=null;
    this.cheques=[];
  }

  private handleDelete(): void {
      if (this.chequeBook) {
        this.chequeBookService.deleteChequeBook(this.chequeBook.acc_num)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              // this.showNotification('Cheque book deleted successfully', 'success');
              this.chequeBook = null;
              this.cheques = [];
              this.chequeForm.reset();
              // this.chequeForm.disable();
            },
            error: (error) => {
              // this.showNotification('Error deleting cheque book', 'error');
              // console.error('Delete error:', error);
            }
          });
      }
    
  }

  private markFormGroupTouched(): void {
    Object.keys(this.chequeForm.controls).forEach(key => {
      const control = this.chequeForm.get(key);
      control?.markAsTouched();
    });
  }

  // Utility Methods
  getFieldError(fieldName: string): string {
    const control = this.chequeForm.get(fieldName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return `${this.getFieldDisplayName(fieldName)} is required`;
      }
      if (control.errors['pattern']) {
        return `${this.getFieldDisplayName(fieldName)} format is invalid`;
      }
      if (control.errors['min']) {
        return `${this.getFieldDisplayName(fieldName)} must be greater than 0`;
      }
    }
    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      'acc_type_cd': 'Account Type',
      'acc_num': 'Account Number',
      'chq_bk_no': 'Cheque Book Number',
      'issue_dt': 'Issue Date',
      'chq_no_from': 'Cheque Number From',
      'chq_no_to': 'Cheque Number To',
      'approval_status': 'Approval Status',
      'created_by': 'Created By',
      'approved_by': 'Approved By',
      'chq_version': 'Cheque Version'
    };
    return displayNames[fieldName] || fieldName;
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.chequeForm.get(fieldName);
    return !!(control?.invalid && control.touched);
  }

  toggleChequeStatus(chequeNo: string): void {
    if (this.isModifyMode) {
      this.chequeBookService.toggleChequeStatus(chequeNo);
    }
  }

  private showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info'): void {
    // Replace with your notification service (Angular Material Snackbar, etc.)
    console.log(`${type.toUpperCase()}: ${message}`);
    
    // Temporary alert - replace with proper notification
    if (type === 'error') {
      alert(`Error: ${message}`);
    } else {
      alert(message);
    }
  }

  // Computed properties for template
  get canSave(): boolean {
    return this.chequeForm.valid && (this.isModifyMode || this.isNewMode);
  }

  get canApprove(): boolean {
    return this.chequeBook?.approval_status === 'U';
  }

  get canModify(): boolean {
    return this.chequeBook !== null && !this.isModifyMode && !this.isNewMode;
  }

  get canDelete(): boolean {
    return this.chequeBook !== null && !this.isModifyMode && !this.isNewMode;
  }


// For the HTML template, update the form controls to match the new field names:
/*
<form [formGroup]="chequeForm" class="cheque-form">
  <div class="form-section">
    <h2>Cheque Issue Details</h2>
    
    <div class="form-group">
      <label for="acc_type_cd">Account Type</label>
      <select formControlName="acc_type_cd" class="form-control">
        <option *ngFor="let type of accountTypes" [value]="type.code">
          {{ type.name }}
        </option>
      </select>
      <div class="error-message" *ngIf="isFieldInvalid('acc_type_cd')">
        {{ getFieldError('acc_type_cd') }}
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="acc_num">Account Number</label>
        <input type="text" formControlName="acc_num" class="form-control">
        <div class="error-message" *ngIf="isFieldInvalid('acc_num')">
          {{ getFieldError('acc_num') }}
        </div>
      </div>
      
      <div class="form-group">
        <label for="chq_bk_no">Cheque Book No</label>
        <input type="text" formControlName="chq_bk_no" class="form-control">
        <div class="error-message" *ngIf="isFieldInvalid('chq_bk_no')">
          {{ getFieldError('chq_bk_no') }}
        </div>
      </div>
    </div>

    <div class="form-group">
      <label for="issue_dt">Issue Date</label>
      <input type="date" formControlName="issue_dt" class="form-control">
      <div class="error-message" *ngIf="isFieldInvalid('issue_dt')">
        {{ getFieldError('issue_dt') }}
      </div>
    </div>

    // ... continue with other form fields using the correct field names

    <!-- Action Buttons -->
    <div class="action-buttons">
      <button type="button" class="btn btn-new" (click)="handleAction('new')">
        New
      </button>
      <button type="button" class="btn btn-save" (click)="handleAction('save')" 
              [disabled]="!canSave">
        Save
      </button>
      <button type="button" class="btn btn-approve" (click)="handleAction('approve')"
              [disabled]="!canApprove">
        Approve
      </button>
      <button type="button" class="btn btn-modify" (click)="handleAction('modify')"
              [disabled]="!canModify">
        Modify
      </button>
      <button type="button" class="btn btn-delete" (click)="handleAction('delete')"
              [disabled]="!canDelete">
        Delete
      </button>
    </div>
  </div>
</form>
*/
 
  // get f() { return this.agentForm.controls; }
  closeScreen()
  {
    this.router.navigate([localStorage.getItem('__bName') + '/la']);
  }
 


 


    getAlertClass(type: MessageType): string {
  switch (type) {
    case MessageType.Sucess:
      return 'alert-success';
    case MessageType.Warning:
      return 'alert-warning';
    case MessageType.Info:
      return 'alert-info';
    case MessageType.Error:
      return 'alert-danger';
    default:
      return 'alert-info';
  }
}
private HandleMessage(show: boolean, type: MessageType = null, message: string = null) {
  this.showMsg = new ShowMessage();
  this.showMsg.Show = show;
  this.showMsg.Type = type;
  this.showMsg.Message = message;

  if (show) {
    setTimeout(() => {
      this.showMsg.Show = false;
    }, 3000); // auto-close after 4 sec
  }
}

getAlertIcon(type: MessageType): string {
  switch (type) {
    case MessageType.Sucess:
      return '✅';
    case MessageType.Warning:
      return '⚠️';
    case MessageType.Info:
      return 'ℹ️';
    case MessageType.Error:
      return '❌';
    default:
      return '🔔';
  }
}


}
