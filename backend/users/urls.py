from django.urls import path
from users.views import UserStatsApiView, render_profile_page, UsersForAdminsApiView

urlpatterns = [
    path('', render_profile_page, name="users"),
    path('me/', UserStatsApiView.as_view(), name='user-me'),
    path('<int:pk>/', UserStatsApiView.as_view(), name='user-stats'),
    path('users_for_admin/', UsersForAdminsApiView.as_view())
]