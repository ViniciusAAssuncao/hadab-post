import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostCategory } from '../../../shared/models/Post';

@Component({
  selector: 'app-post-category',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './post-category.component.html',
  styles: []
})
export class PostCategoryComponent {
  @Input({ required: true }) category!: PostCategory;
}

