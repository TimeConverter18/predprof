from django.urls import path

from .views import SubjectsListAPIView, ReturnTaskAPIView, TasksListAPIView, TaskViewSet, CheckTaskView, ImportTasksView, TaskExportView, AdminTaskView

urlpatterns = [
    path('', TasksListAPIView.as_view()),
    path('<int:pk>/', ReturnTaskAPIView.as_view()),
    path('<int:pk>/check/', CheckTaskView.as_view()),
    path('import/', ImportTasksView.as_view()),
    path('subjects/', SubjectsListAPIView.as_view()),
    path ('create/', TaskViewSet.as_view({'post': 'create'})),
    path('export/', TaskExportView.as_view()),
    path('admin_tasks/', AdminTaskView.as_view())
]