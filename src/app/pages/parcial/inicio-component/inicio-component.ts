import { Component, inject } from '@angular/core';
import { NavigationComponent } from '../navigation-component/navigation-component';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SidebarService } from '../../../services/sidebar-service';

@Component({
  selector: 'app-inicio-component',
  imports: [NavigationComponent, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './inicio-component.html',
  styleUrl: './inicio-component.css',
})
export class InicioComponent {
  sidebarService = inject(SidebarService)
}
