from django.urls import path

from user_statistics.views import LeaderBoard, StatisticsAboutTasks

urlpatterns = [
    path('leader_board/', LeaderBoard.as_view(), name='leader_board'),
    path('count_of_solved/', StatisticsAboutTasks.as_view(), name='count_of_solved'),
]