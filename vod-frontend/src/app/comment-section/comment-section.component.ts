import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommentService, Comment } from '../comment.service';
import { UserService } from '../user.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-comment-section',
  standalone: true,
  templateUrl: './comment-section.component.html',
  styleUrls: ['./comment-section.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
})
export class CommentSectionComponent implements OnInit, OnDestroy {
  @Input() videoId!: number;
  
  comments: Comment[] = [];
  newComment: string = '';
  isLoading: boolean = false;
  isSubmitting: boolean = false;
  isLoggedIn: boolean = false;
  currentUserId: number | null = null;
  editingCommentId: number | null = null;
  editingContent: string = '';
  showDeleteModal: boolean = false;
  commentToDelete: number | null = null;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private commentService: CommentService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.checkAuthStatus();
    this.loadComments();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  checkAuthStatus(): void {
    this.isLoggedIn = this.userService.isAuthenticated();
    if (this.isLoggedIn) {
      const userId = this.userService.getUserID();
      this.currentUserId = userId || null;
    }
  }

  loadComments(): void {
    this.isLoading = true;
    const sub = this.commentService.getVideoComments(this.videoId).subscribe({
      next: (comments) => {
        this.comments = comments;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading comments:', error);
        this.isLoading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  addComment(): void {
    if (!this.newComment.trim() || this.isSubmitting) return;

    this.isSubmitting = true;
    const sub = this.commentService.addComment(this.videoId, this.newComment.trim()).subscribe({
      next: (newComment) => {
        this.comments.unshift(newComment); // Add to beginning of array
        this.newComment = '';
        this.isSubmitting = false;
        // Comment added successfully
      },
      error: (error) => {
        console.error('Error adding comment:', error);
        this.isSubmitting = false;
        alert('Error adding comment: ' + (error.message || 'Please login first'));
      }
    });
    this.subscriptions.push(sub);
  }

  deleteComment(commentId: number): void {
    if (!commentId || this.isSubmitting) return;
    
    this.isSubmitting = true;
    const sub = this.commentService.deleteComment(commentId).subscribe({
      next: () => {
        this.comments = this.comments.filter(c => c.id !== commentId);
        this.isSubmitting = false;
        this.showDeleteModal = false;
        this.commentToDelete = null;
        // Comment deleted successfully
      },
      error: (error) => {
        console.error('Error deleting comment:', error);
        this.isSubmitting = false;
        this.showDeleteModal = false;
        this.commentToDelete = null;
        alert('Error deleting comment: ' + (error.message || 'Please try again'));
      }
    });
    this.subscriptions.push(sub);
  }

  canEdit(comment: Comment): boolean {
    return this.isLoggedIn && this.currentUserId === comment.user_id;
  }

  canDelete(comment: Comment): boolean {
    return this.isLoggedIn && this.currentUserId === comment.user_id;
  }

  startEdit(comment: Comment): void {
    this.editingCommentId = comment.id;
    this.editingContent = comment.content;
  }

  cancelEdit(): void {
    this.editingCommentId = null;
    this.editingContent = '';
  }

  saveEdit(commentId: number): void {
    if (!this.editingContent.trim()) return;

    this.isSubmitting = true;
    const sub = this.commentService.updateComment(commentId, this.editingContent.trim()).subscribe({
      next: (updatedComment) => {
        const index = this.comments.findIndex(c => c.id === commentId);
        if (index !== -1) {
          this.comments[index] = updatedComment;
        }
        this.cancelEdit();
        this.isSubmitting = false;
        // Comment updated successfully
      },
      error: (error) => {
        console.error('Error updating comment:', error);
        this.isSubmitting = false;
        alert('Error updating comment: ' + (error.message || 'Please try again'));
      }
    });
    this.subscriptions.push(sub);
  }

  confirmDelete(commentId: number): void {
    this.commentToDelete = commentId;
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.commentToDelete = null;
  }

  formatDate(dateString: string): string {
    // Parse the date string as UTC
    const date = new Date(dateString + 'Z'); // Force UTC parsing
    const now = new Date();
    
    // Get the time difference in milliseconds
    const diffInMs = now.getTime() - date.getTime();
    const diffInSeconds = Math.floor(diffInMs / 1000);
    
    if (diffInSeconds < 30) {
      return 'Just now';
    } else if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) { // 1 hour
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInSeconds < 86400) { // 24 hours
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffInSeconds < 604800) { // 7 days
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    } else if (diffInSeconds < 2592000) { // ~30 days
      const weeks = Math.floor(diffInSeconds / 604800);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else {
      return date.toLocaleDateString('hu-HU');
    }
  }
}