import { Component } from '@angular/core';
import { LucideAngularModule, Menu, Search, Bell } from "lucide-angular";

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  menuIcon = Menu;
  searchIcon = Search;
  bellIcon = Bell;
}