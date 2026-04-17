from django.shortcuts import render
from rest_framework.generics import RetrieveAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.generics import RetrieveAPIView, ListAPIView
from rest_framework.pagination import PageNumberPagination
from users.models import User
from users.serializers import UserStatsSerializer, UsersListSerializer


class UserStatsApiView(RetrieveAPIView):
    serializer_class = UserStatsSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        pk = self.kwargs.get('pk')
        if pk:
            return User.objects.get(pk=pk)
        return self.request.user


def render_profile_page(request):
    return render(request, 'profile.html')


class UserListPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class UsersForAdminsApiView(ListAPIView):
    serializer_class = UsersListSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = UserListPagination

    def get_queryset(self):
        return User.objects.only('username', 'email', 'rating').order_by('-rating')