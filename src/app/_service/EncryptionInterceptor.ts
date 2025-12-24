import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { EncryptionService } from './EncryptionService.service';

@Injectable()
export class EncryptionInterceptor implements HttpInterceptor {
  constructor(private encryptionService: EncryptionService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Encrypt request body if present
    let encryptedReq = req;
    if (req.body) {
      const encryptedBody = this.encryptionService.encryptObject(req.body);
      encryptedReq = req.clone({ body: { data: encryptedBody } });
    }

    return next.handle(encryptedReq).pipe(
      map(event => {
        if (event instanceof HttpResponse && event.body && event.body.data) {
          // Decrypt response body
          const decryptedBody = this.encryptionService.decryptToObject(event.body.data);
          return event.clone({ body: decryptedBody });
        }
        return event;
      })
    );
  }
}
