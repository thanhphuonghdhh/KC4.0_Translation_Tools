from infrastructure.configs.main import GlobalConfig
from infrastructure.adapters.background_task_manager.main import BackgroundTaskManager
from apscheduler.schedulers.asyncio import AsyncIOScheduler

def init_test_background_tasks(config: GlobalConfig):
    
    from tests.background_tasks.delete_invalid_file import add_fresh_jobs as add_fresh_jobs_1

    BACKGROUND_TASKS = config.APP_CONFIG.TEST_BACKGROUND_TASKS

    new_background_task_scheduler = BackgroundTaskManager(AsyncIOScheduler())

    new_background_task_scheduler.remove_all_jobs()
    
    new_background_task_scheduler = add_fresh_jobs_1(new_background_task_scheduler, BACKGROUND_TASKS)
