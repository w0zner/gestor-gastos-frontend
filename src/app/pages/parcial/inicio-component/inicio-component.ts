import { Component } from '@angular/core';
import { NavigationComponent } from '../navigation-component/navigation-component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-inicio-component',
  imports: [NavigationComponent, RouterOutlet],
  templateUrl: './inicio-component.html',
  styleUrl: './inicio-component.css',
})
export class InicioComponent {}
