import asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
import json

from app.database.models import CSVImport, CSVImportLog
from app.core.enums import CSVImportStatus

class CSVProgressTracker:
    """
    Service for tracking and managing CSV import progress with real-time updates.
    """
    
    def __init__(self, db: Session):
        self.db = db
        self._progress_callbacks = {}
        self._active_imports = set()
    
    async def start_import_tracking(
        self,
        upload_id: str,
        filename: str,
        total_rows: int,
        user_id: str,
        import_config: Dict[str, Any]
    ) -> CSVImport:
        """
        Initialize tracking for a new CSV import.
        
        Args:
            upload_id: Unique identifier for the import
            filename: Name of the uploaded file
            total_rows: Total number of rows to process
            user_id: ID of the user performing the import
            import_config: Configuration for the import
        
        Returns:
            Created CSVImport record
        """
        csv_import = CSVImport(
            upload_id=upload_id,
            filename=filename,
            user_id=user_id,
            status=CSVImportStatus.PENDING,
            total_count=total_rows,
            processed_count=0,
            progress_percentage=0.0,
            config=json.dumps(import_config),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        self.db.add(csv_import)
        self.db.commit()
        
        # Add to active imports
        self._active_imports.add(upload_id)
        
        return csv_import
    
    async def update_progress(
        self,
        upload_id: str,
        processed_count: int,
        status: Optional[CSVImportStatus] = None,
        additional_data: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Update the progress of an import operation.
        
        Args:
            upload_id: Unique identifier for the import
            processed_count: Number of rows processed
            status: New status (optional)
            additional_data: Additional data to store (optional)
        """
        csv_import = self.db.query(CSVImport).filter(
            CSVImport.upload_id == upload_id
        ).first()
        
        if not csv_import:
            return
        
        # Update progress
        csv_import.processed_count = processed_count
        if csv_import.total_count > 0:
            csv_import.progress_percentage = (processed_count / csv_import.total_count) * 100
        
        # Update status if provided
        if status:
            csv_import.status = status
        
        # Update additional data
        if additional_data:
            current_data = json.loads(csv_import.config or '{}')
            current_data.update(additional_data)
            csv_import.config = json.dumps(current_data)
        
        csv_import.updated_at = datetime.utcnow()
        
        # Auto-complete if all rows processed
        if processed_count >= csv_import.total_count and csv_import.status == CSVImportStatus.PROCESSING:
            csv_import.status = CSVImportStatus.COMPLETED
            self._active_imports.discard(upload_id)
        
        self.db.commit()
        
        # Trigger progress callbacks
        await self._trigger_progress_callbacks(upload_id, csv_import)
    
    async def log_row_result(
        self,
        upload_id: str,
        row_number: int,
        status: str,
        job_id: Optional[int] = None,
        error_message: Optional[str] = None,
        data: Optional[Dict[str, Any]] = None,
        processing_time: Optional[float] = None
    ) -> None:
        """
        Log the result of processing a single row.
        
        Args:
            upload_id: Unique identifier for the import
            row_number: Row number in the CSV
            status: Processing status (success, error, duplicate, validation_failed)
            job_id: ID of created job (if successful)
            error_message: Error message (if failed)
            data: Original row data
            processing_time: Time taken to process this row
        """
        log_entry = CSVImportLog(
            upload_id=upload_id,
            row_number=row_number,
            status=status,
            job_id=job_id,
            error_message=error_message,
            data=json.dumps(data) if data else None,
            processing_time=processing_time,
            created_at=datetime.utcnow()
        )
        
        self.db.add(log_entry)
        self.db.commit()
    
    async def get_import_progress(self, upload_id: str) -> Dict[str, Any]:
        """
        Get detailed progress information for an import.
        
        Args:
            upload_id: Unique identifier for the import
        
        Returns:
            Dictionary with progress information
        """
        csv_import = self.db.query(CSVImport).filter(
            CSVImport.upload_id == upload_id
        ).first()
        
        if not csv_import:
            return {'error': 'Import not found'}
        
        # Get statistics from logs
        log_stats = self.db.query(
            CSVImportLog.status,
            func.count(CSVImportLog.id).label('count'),
            func.avg(CSVImportLog.processing_time).label('avg_time')
        ).filter(
            CSVImportLog.upload_id == upload_id
        ).group_by(CSVImportLog.status).all()
        
        statistics = {}
        total_processing_time = 0
        for stat in log_stats:
            statistics[stat.status] = {
                'count': stat.count,
                'avg_processing_time': float(stat.avg_time) if stat.avg_time else 0
            }
            if stat.avg_time:
                total_processing_time += stat.avg_time * stat.count
        
        # Calculate estimated time remaining
        estimated_time_remaining = None
        if csv_import.processed_count > 0 and csv_import.status == CSVImportStatus.PROCESSING:
            remaining_rows = csv_import.total_count - csv_import.processed_count
            avg_time_per_row = total_processing_time / csv_import.processed_count
            estimated_time_remaining = remaining_rows * avg_time_per_row
        
        return {
            'upload_id': upload_id,
            'filename': csv_import.filename,
            'status': csv_import.status.value,
            'total_count': csv_import.total_count,
            'processed_count': csv_import.processed_count,
            'progress_percentage': round(csv_import.progress_percentage, 2),
            'created_at': csv_import.created_at.isoformat(),
            'updated_at': csv_import.updated_at.isoformat(),
            'statistics': statistics,
            'estimated_time_remaining': estimated_time_remaining,
            'is_active': upload_id in self._active_imports
        }
    
    async def get_recent_logs(
        self,
        upload_id: str,
        limit: int = 50,
        status_filter: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get recent log entries for an import.
        
        Args:
            upload_id: Unique identifier for the import
            limit: Maximum number of logs to return
            status_filter: Filter by status (optional)
        
        Returns:
            List of log entries
        """
        query = self.db.query(CSVImportLog).filter(
            CSVImportLog.upload_id == upload_id
        )
        
        if status_filter:
            query = query.filter(CSVImportLog.status == status_filter)
        
        logs = query.order_by(
            CSVImportLog.created_at.desc()
        ).limit(limit).all()
        
        return [{
            'row_number': log.row_number,
            'status': log.status,
            'job_id': log.job_id,
            'error_message': log.error_message,
            'processing_time': log.processing_time,
            'created_at': log.created_at.isoformat(),
            'data': json.loads(log.data) if log.data else None
        } for log in logs]
    
    async def cancel_import(self, upload_id: str, reason: str = 'User cancelled') -> bool:
        """
        Cancel an ongoing import.
        
        Args:
            upload_id: Unique identifier for the import
            reason: Reason for cancellation
        
        Returns:
            True if cancelled successfully
        """
        csv_import = self.db.query(CSVImport).filter(
            CSVImport.upload_id == upload_id
        ).first()
        
        if not csv_import:
            return False
        
        # Only allow cancellation of active imports
        if csv_import.status in [
            CSVImportStatus.PENDING,
            CSVImportStatus.VALIDATING,
            CSVImportStatus.PROCESSING
        ]:
            csv_import.status = CSVImportStatus.CANCELLED
            csv_import.updated_at = datetime.utcnow()
            
            # Update config with cancellation reason
            config = json.loads(csv_import.config or '{}')
            config['cancellation_reason'] = reason
            config['cancelled_at'] = datetime.utcnow().isoformat()
            csv_import.config = json.dumps(config)
            
            self.db.commit()
            
            # Remove from active imports
            self._active_imports.discard(upload_id)
            
            return True
        
        return False
    
    async def get_active_imports(self) -> List[Dict[str, Any]]:
        """
        Get all currently active imports.
        
        Returns:
            List of active import information
        """
        active_imports = self.db.query(CSVImport).filter(
            CSVImport.status.in_([
                CSVImportStatus.PENDING,
                CSVImportStatus.VALIDATING,
                CSVImportStatus.PROCESSING
            ])
        ).all()
        
        return [{
            'upload_id': imp.upload_id,
            'filename': imp.filename,
            'status': imp.status.value,
            'progress_percentage': round(imp.progress_percentage, 2),
            'processed_count': imp.processed_count,
            'total_count': imp.total_count,
            'created_at': imp.created_at.isoformat(),
            'updated_at': imp.updated_at.isoformat()
        } for imp in active_imports]
    
    async def register_progress_callback(self, upload_id: str, callback):
        """
        Register a callback function to be called when progress updates.
        
        Args:
            upload_id: Unique identifier for the import
            callback: Async function to call on progress updates
        """
        if upload_id not in self._progress_callbacks:
            self._progress_callbacks[upload_id] = []
        self._progress_callbacks[upload_id].append(callback)
    
    async def unregister_progress_callback(self, upload_id: str, callback):
        """
        Unregister a progress callback.
        
        Args:
            upload_id: Unique identifier for the import
            callback: Callback function to remove
        """
        if upload_id in self._progress_callbacks:
            try:
                self._progress_callbacks[upload_id].remove(callback)
                if not self._progress_callbacks[upload_id]:
                    del self._progress_callbacks[upload_id]
            except ValueError:
                pass
    
    async def _trigger_progress_callbacks(self, upload_id: str, csv_import: CSVImport):
        """
        Trigger all registered callbacks for an import.
        
        Args:
            upload_id: Unique identifier for the import
            csv_import: Updated CSVImport record
        """
        if upload_id in self._progress_callbacks:
            progress_data = {
                'upload_id': upload_id,
                'status': csv_import.status.value,
                'progress_percentage': csv_import.progress_percentage,
                'processed_count': csv_import.processed_count,
                'total_count': csv_import.total_count,
                'updated_at': csv_import.updated_at.isoformat()
            }
            
            # Call all callbacks
            for callback in self._progress_callbacks[upload_id]:
                try:
                    await callback(progress_data)
                except Exception as e:
                    # Log callback errors but don't fail the update
                    print(f"Progress callback error: {str(e)}")
    
    async def cleanup_old_imports(self, days_old: int = 30) -> int:
        """
        Clean up old import records and logs.
        
        Args:
            days_old: Number of days after which to clean up records
        
        Returns:
            Number of records cleaned up
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days_old)
        
        # Delete old logs first (due to foreign key constraint)
        old_logs = self.db.query(CSVImportLog).join(CSVImport).filter(
            CSVImport.created_at < cutoff_date,
            CSVImport.status.in_([
                CSVImportStatus.COMPLETED,
                CSVImportStatus.FAILED,
                CSVImportStatus.CANCELLED
            ])
        ).delete(synchronize_session=False)
        
        # Delete old import records
        old_imports = self.db.query(CSVImport).filter(
            CSVImport.created_at < cutoff_date,
            CSVImport.status.in_([
                CSVImportStatus.COMPLETED,
                CSVImportStatus.FAILED,
                CSVImportStatus.CANCELLED
            ])
        ).delete(synchronize_session=False)
        
        self.db.commit()
        
        return old_imports + old_logs