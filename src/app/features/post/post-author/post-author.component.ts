import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, CheckCircle, MoreHorizontal } from 'lucide-angular';
import { Post } from '../../../shared/models/Post';
import { VERIFICATION_BADGE_INFO } from '../../../shared/components/verification-badge.data';

@Component({
  selector: 'app-post-author',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './post-author.component.html',
  styles: []
})
export class PostAuthorComponent {
  @Input({ required: true }) post!: Post;

  readonly CheckCircleIcon = CheckCircle;
  readonly MoreHorizontalIcon = MoreHorizontal;
  readonly verificationInfo = VERIFICATION_BADGE_INFO;
}