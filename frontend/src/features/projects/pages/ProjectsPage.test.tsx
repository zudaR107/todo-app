import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectsPage } from './ProjectsPage';

const {
  mockUseProjectsQuery,
  mockUseCreateProjectMutation,
  mockUseUpdateProjectMutation,
  mockUseDeleteProjectMutation,
  mockNavigate,
} = vi.hoisted(() => ({
  mockUseProjectsQuery: vi.fn(),
  mockUseCreateProjectMutation: vi.fn(),
  mockUseUpdateProjectMutation: vi.fn(),
  mockUseDeleteProjectMutation: vi.fn(),
  mockNavigate: vi.fn(),
}));

vi.mock('../hooks', () => ({
  useProjectsQuery: () => mockUseProjectsQuery(),
  useCreateProjectMutation: () => mockUseCreateProjectMutation(),
  useUpdateProjectMutation: () => mockUseUpdateProjectMutation(),
  useDeleteProjectMutation: () => mockUseDeleteProjectMutation(),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

beforeEach(() => {
  mockUseProjectsQuery.mockReset();
  mockUseCreateProjectMutation.mockReset();
  mockUseUpdateProjectMutation.mockReset();
  mockUseDeleteProjectMutation.mockReset();
  mockNavigate.mockReset();
});

describe('ProjectsPage', () => {
  it('renders list of projects', () => {
    mockUseProjectsQuery.mockReturnValue({
      data: [
        {
          id: 'p1',
          name: 'Проект 1',
          color: '#10b981',
          ownerId: 'u1',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
      ],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      isFetching: false,
    });

    mockUseCreateProjectMutation.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
    mockUseUpdateProjectMutation.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
    mockUseDeleteProjectMutation.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });

    render(<ProjectsPage />);

    expect(screen.getByText('Проекты')).toBeInTheDocument();
    expect(screen.getByText('Проект 1')).toBeInTheDocument();
  });

  it('shows empty state when there are no projects', () => {
    mockUseProjectsQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      isFetching: false,
    });

    mockUseCreateProjectMutation.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
    mockUseUpdateProjectMutation.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
    mockUseDeleteProjectMutation.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });

    render(<ProjectsPage />);

    expect(screen.getByText('Проектов пока нет.')).toBeInTheDocument();
    expect(
      screen.getByText(
        /Создайте первый проект, чтобы начать планировать задачи и видеть их в списке и на доске/i,
      ),
    ).toBeInTheDocument();
  });

  it('submits create project form', async () => {
    const user = userEvent.setup();

    mockUseProjectsQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      isFetching: false,
    });

    const mutateAsync = vi.fn().mockResolvedValue({
      id: 'p2',
      name: 'Новый проект',
      color: '#10b981',
      ownerId: 'u1',
      createdAt: '2025-01-02T00:00:00.000Z',
      updatedAt: '2025-01-02T00:00:00.000Z',
    });

    mockUseCreateProjectMutation.mockReturnValue({
      mutateAsync,
      isPending: false,
    });
    mockUseUpdateProjectMutation.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
    mockUseDeleteProjectMutation.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });

    render(<ProjectsPage />);

    const nameInput = screen.getByLabelText(/название проекта/i);
    await user.type(nameInput, 'Новый проект');

    const form = nameInput.closest('form');
    expect(form).not.toBeNull();

    const submitButton = within(form as HTMLElement).getByRole('button', {
      name: /создать проект/i,
    });

    await user.click(submitButton);

    expect(mutateAsync).toHaveBeenCalledTimes(1);
    expect(mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Новый проект',
      }),
    );
  });

  it('deletes project after confirmation', async () => {
    const user = userEvent.setup();

    mockUseProjectsQuery.mockReturnValue({
      data: [
        {
          id: 'p1',
          name: 'Проект на удаление',
          color: '#10b981',
          ownerId: 'u1',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
      ],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      isFetching: false,
    });

    mockUseCreateProjectMutation.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
    mockUseUpdateProjectMutation.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });

    const deleteMutateAsync = vi.fn().mockResolvedValue(undefined);
    mockUseDeleteProjectMutation.mockReturnValue({
      mutateAsync: deleteMutateAsync,
      isPending: false,
    });

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<ProjectsPage />);

    const deleteButton = screen.getByRole('button', { name: /удалить/i });
    await user.click(deleteButton);

    expect(confirmSpy).toHaveBeenCalled();
    expect(deleteMutateAsync).toHaveBeenCalledWith('p1');

    confirmSpy.mockRestore();
  });

  it('navigates to tasks page when "Открыть" is clicked', async () => {
    const user = userEvent.setup();

    mockUseProjectsQuery.mockReturnValue({
      data: [
        {
          id: 'p1',
          name: 'Проект для перехода',
          color: '#10b981',
          ownerId: 'u1',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
      ],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      isFetching: false,
    });

    mockUseCreateProjectMutation.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
    mockUseUpdateProjectMutation.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
    mockUseDeleteProjectMutation.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });

    render(<ProjectsPage />);

    const openButton = screen.getByRole('button', { name: /открыть/i });
    await user.click(openButton);

    expect(mockNavigate).toHaveBeenCalledWith('/projects/p1/tasks');
  });

  it('shows error banner and calls refetch on retry', async () => {
    const user = userEvent.setup();
    const refetch = vi.fn();

    mockUseProjectsQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch,
      isFetching: false,
    });

    mockUseCreateProjectMutation.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
    mockUseUpdateProjectMutation.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
    mockUseDeleteProjectMutation.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });

    render(<ProjectsPage />);

    expect(screen.getByText('Не удалось загрузить проекты.')).toBeInTheDocument();

    const retryButton = screen.getByRole('button', { name: /повторить/i });
    await user.click(retryButton);

    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('updates project name via inline edit', async () => {
    const user = userEvent.setup();

    mockUseProjectsQuery.mockReturnValue({
      data: [
        {
          id: 'p1',
          name: 'Старое имя',
          color: '#10b981',
          ownerId: 'u1',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
      ],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      isFetching: false,
    });

    mockUseCreateProjectMutation.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });

    const updateMutateAsync = vi.fn().mockResolvedValue(undefined);
    mockUseUpdateProjectMutation.mockReturnValue({
      mutateAsync: updateMutateAsync,
      isPending: false,
    });

    mockUseDeleteProjectMutation.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });

    render(<ProjectsPage />);

    const editButton = screen.getByRole('button', { name: /редактировать/i });
    await user.click(editButton);

    const nameInput = screen.getByDisplayValue('Старое имя');
    await user.clear(nameInput);
    await user.type(nameInput, 'Новое имя');

    const saveButton = screen.getByRole('button', { name: /сохранить/i });
    await user.click(saveButton);

    expect(updateMutateAsync).toHaveBeenCalledTimes(1);
    expect(updateMutateAsync).toHaveBeenCalledWith({
      id: 'p1',
      body: expect.objectContaining({
        name: 'Новое имя',
      }),
    });
  });
});
