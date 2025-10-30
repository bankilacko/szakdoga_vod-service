import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

// Comment interface for type safety
export interface Comment {
  id: number;
  video_id: number;
  user_id: number;
  username: string;
  content: string;
  created_at: string;
  updated_at: string;
}

// Comment creation interface
export interface CommentCreate {
  video_id: number;
  content: string;
}

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  // API URL for vod-management-service
  private apiUrl = 'http://152.66.245.139:22291/vod-management-service'; // VM with port forwarding
  //private apiUrl = 'http://localhost:5000/vod-management-service'; // Local development

  constructor(private http: HttpClient) {}

  // Get all comments for a specific video
  getVideoComments(videoId: number): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.apiUrl}/videos/${videoId}/comments`);
  }

  // Add a new comment to a video
  addComment(videoId: number, content: string): Observable<Comment> {
    const commentData: CommentCreate = {
      video_id: videoId,
      content: content
    };

    // Get JWT token from sessionStorage (same as user service)
    const token = sessionStorage.getItem('jwtToken');
    
    if (!token) {
      throw new Error('No authentication token found. Please login first.');
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.post<Comment>(`${this.apiUrl}/videos/${videoId}/comments`, commentData, { headers });
  }

  // Update a comment (only by the comment author)
  updateComment(commentId: number, content: string): Observable<Comment> {
    // Get JWT token from sessionStorage (same as user service)
    const token = sessionStorage.getItem('jwtToken');
    
    if (!token) {
      throw new Error('No authentication token found. Please login first.');
    }
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    const updateData = { content: content };
    return this.http.put<Comment>(`${this.apiUrl}/comments/${commentId}`, updateData, { headers });
  }

  // Delete a comment (only by the comment author)
  deleteComment(commentId: number): Observable<any> {
    // Get JWT token from sessionStorage (same as user service)
    const token = sessionStorage.getItem('jwtToken');
    
    if (!token) {
      throw new Error('No authentication token found. Please login first.');
    }
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.delete(`${this.apiUrl}/comments/${commentId}`, { headers });
  }
}

