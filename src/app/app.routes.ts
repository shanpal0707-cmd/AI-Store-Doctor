import { Routes } from '@angular/router';

import { Products } from './products/products';
import { StoreSetup } from './store-setup/store-setup';
import { Dashboard } from './dashboard/dashboard';
import { AiAnalysis } from './ai-analysis/ai-analysis';
import { BusinessAnalysis } from './business-analysis/business-analysis';
import { AiContentCreator } from './ai-content-creator/ai-content-creator';
import { MarketIntelligence } from './market-intelligence/market-intelligence';
import { MyStore } from './my-store/my-store';
import { Profile } from './profile/profile';
import { Signup } from './signup/signup';
import { Login } from './login/login';
import { Settings } from './settings/settings';
import { Home } from './home/home';

export const routes: Routes = [

  {
    path: '',
    component: Login
  },

  {
    path: 'home',
    component: Home
  },

  {
    path: 'products',
    component: Products
  },

  {
    path: 'ai-analysis',
    component: AiAnalysis
  },

  {
    path: 'store-setup',
    component: StoreSetup
  },

  {
    path: 'dashboard',
    component: Dashboard
  },
    { path: 'business-analysis', 
      component: BusinessAnalysis }
   ,
  {
    path: 'ai-content-creator',
    component: AiContentCreator
  },

  {
    path: 'market-intelligence',
    component: MarketIntelligence
  },

  {
    path: 'my-store',
    component: MyStore
  },

  {
    path: 'profile',
    component: Profile
  },

  {
    path: 'signup',
    component: Signup
  },

  {
    path: 'login',
    component: Login
  },

  {
    path: 'settings',
    component: Settings
  }

];