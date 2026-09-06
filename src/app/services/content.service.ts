
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ContentResult {
  status: string;
  productName: string;
  contentType: string;
  marketingGoal: string;
  generatedContent: string;
  suggestedHeadline: string;
  callToAction: string;
  marketingTips: string[];
  hashtags: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ContentService {

  private readonly url = '/api/content';

  constructor(private http: HttpClient) {}

  generate(
    store: object,
    product: object,
    contentType: string,
    marketingGoal: string
  ): Observable<ContentResult> {

    return this.http.post<ContentResult>(this.url, {
      store,
      product,
      contentType,
      marketingGoal
    });
  }
}
