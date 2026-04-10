import uuid
import json
import time
import os
from nexttoken import NextToken
from db import init_db, create_job, update_job_status, save_result, get_history, delete_job, save_agent_session

# Load instructions conventions:
# Dialect influence for status messages
STATUS_MSGS = {
    "egyptian": {
        "starting": "يلا بينا.. بنبدأ دلوقتي",
        "fetching": "بنسحب الداتا أهو.. استنى شوية",
        "crawling": "بنلف في الموقع حتة حتة",
        "thinking": "بفكر أهو.. ثانية واحدة",
        "acting": "بعمل المهمة دلوقتي.. متقلقش",
        "done": "خلاص خلصنا! الداتا جاهزة",
        "error": "حصلت مشكلة يا فنان: {error}"
    },
    "saudi": {
        "starting": "بسم الله.. نبدأ الحين",
        "fetching": "قاعدين نسحب البيانات.. لحظات",
        "crawling": "نتجول في الموقع ونشوف وش فيه",
        "thinking": "قاعد أفكر.. ثواني بس",
        "acting": "قاعد أنفذ المهمة الحين.. أبشر",
        "done": "تم بحمد الله! البيانات جاهزة",
        "error": "صارت مشكلة يا طويل العمر: {error}"
    }
}

def _get_msg(dialect, key, **kwargs):
    d = dialect.lower() if dialect else "egyptian"
    if d not in STATUS_MSGS:
        d = "egyptian"
    msg = STATUS_MSGS[d].get(key, key)
    return msg.format(**kwargs)

# RPC Functions

def scrape_url(url: str, dialect: str = "egyptian"):
    print(f"[BACKEND_START] scrape_url called with url={url}, dialect={dialect}")
    init_db()
    job_id = str(uuid.uuid4())
    create_job(job_id, url, "scrape", dialect)
    
    client = NextToken()
    try:
        update_job_status(job_id, "processing")
        print(f"[BACKEND_STEP] fetching {url}")
        page = client.fetch.url(url)
        
        markdown = page.get("content", "")
        metadata = {
            "title": page.get("title"),
            "url": page.get("url"),
            "content_length": page.get("content_length"),
            "links_count": len(page.get("links", []))
        }
        
        save_result(job_id, url, markdown, metadata)
        update_job_status(job_id, "completed")
        
        result = {"id": job_id, "markdown": markdown, "metadata": metadata}
        print(f"[BACKEND_SUCCESS] scrape_url complete for {url}")
        return result
    except Exception as e:
        error_msg = str(e)
        update_job_status(job_id, f"error: {error_msg}")
        print(f"[BACKEND_ERROR] scrape_url failed: {error_msg}")
        raise

def crawl_domain_streaming(url: str, limit: int = 5, dialect: str = "egyptian"):
    print(f"[BACKEND_START] crawl_domain_streaming called with url={url}, limit={limit}, dialect={dialect}")
    init_db()
    job_id = str(uuid.uuid4())
    create_job(job_id, url, "crawl", dialect)
    
    yield {"type": "status", "content": _get_msg(dialect, "starting"), "progress": 5}
    
    client = NextToken()
    visited = set()
    queue = [url]
    results_count = 0
    
    try:
        update_job_status(job_id, "processing")
        while queue and results_count < limit:
            current_url = queue.pop(0)
            if current_url in visited:
                continue
            visited.add(current_url)
            
            yield {"type": "status", "content": _get_msg(dialect, "fetching") + f" ({current_url})", "progress": int((results_count/limit)*90) + 5}
            
            try:
                page = client.fetch.url(current_url)
                markdown = page.get("content", "")
                save_result(job_id, current_url, markdown, {"title": page.get("title")})
                
                yield {
                    "type": "page", 
                    "url": current_url, 
                    "content": markdown[:500] + "..." if len(markdown) > 500 else markdown,
                    "title": page.get("title")
                }
                
                results_count += 1
                
                # Simple domain-bound discovery
                from urllib.parse import urlparse, urljoin
                domain = urlparse(url).netloc
                for link in page.get("links", []):
                    full_link = urljoin(current_url, link)
                    if urlparse(full_link).netloc == domain and full_link not in visited:
                        queue.append(full_link)
            except Exception as e:
                print(f"[BACKEND_STEP] Failed to fetch {current_url}: {e}")
                continue
        
        update_job_status(job_id, "completed")
        yield {"type": "status", "content": _get_msg(dialect, "done"), "progress": 100, "result": {"job_id": job_id, "pages_crawled": results_count}}
        print(f"[BACKEND_SUCCESS] crawl_domain_streaming complete for {url}")
        
    except Exception as e:
        error_msg = str(e)
        update_job_status(job_id, f"error: {error_msg}")
        print(f"[BACKEND_ERROR] crawl_domain_streaming failed: {error_msg}")
        yield {"type": "status", "content": _get_msg(dialect, "error", error=error_msg), "progress": 0, "error": error_msg}

def run_agent_task_streaming(task: str, dialect: str = "egyptian"):
    print(f"[BACKEND_START] run_agent_task_streaming called with task={task}, dialect={dialect}")
    init_db()
    session_id = str(uuid.uuid4())
    
    # Simulate an agent loop with thinking and acting steps
    # In a real app, this would use a more complex prompt and tool loop
    # We follow the agent_building pattern: thinking -> action -> result
    
    client = NextToken()
    history = [{"role": "user", "content": task}]
    
    yield {"type": "status", "content": _get_msg(dialect, "starting"), "progress": 5}
    
    try:
        # Step 1: Thinking
        yield {"type": "thinking", "content": _get_msg(dialect, "thinking"), "progress": 20}
        time.sleep(1) # simulate thinking
        
        # Call LLM to decide initial thoughts
        resp = client.chat.completions.create(
            model="gemini-2.5-flash-lite",
            messages=[{"role": "system", "content": f"You are an agent named Kharbasha. Respond in a friendly tone based on the dialect: {dialect}. Decide on 2-3 steps to perform the task: {task}"}]
        )
        thought = resp.choices[0].message.content
        yield {"type": "thinking", "content": thought, "progress": 40}
        history.append({"role": "assistant", "content": thought})
        
        # Step 2: Action simulation
        yield {"type": "action", "content": _get_msg(dialect, "acting"), "progress": 60}
        time.sleep(1.5) # simulate action
        
        # Step 3: Result
        final_resp = client.chat.completions.create(
            model="gemini-2.5-flash-lite",
            messages=[{"role": "system", "content": f"You are Kharbasha. Summarize the result of the task '{task}' in the {dialect} dialect. Be creative but concise."}]
        )
        final_result = final_resp.choices[0].message.content
        history.append({"role": "assistant", "content": final_result})
        
        save_agent_session(session_id, task, history, final_result)
        
        yield {"type": "done", "result": final_result, "progress": 100}
        print(f"[BACKEND_SUCCESS] run_agent_task_streaming complete for task={task}")
        
    except Exception as e:
        error_msg = str(e)
        print(f"[BACKEND_ERROR] run_agent_task_streaming failed: {error_msg}")
        yield {"type": "status", "content": _get_msg(dialect, "error", error=error_msg), "progress": 0, "error": error_msg}

def get_history_rpc(limit: int = 20):
    print(f"[BACKEND_START] get_history_rpc called with limit={limit}")
    init_db()
    try:
        history = get_history(limit)
        print(f"[BACKEND_SUCCESS] get_history_rpc returning {len(history)} items")
        return history
    except Exception as e:
        print(f"[BACKEND_ERROR] get_history_rpc failed: {e}")
        raise

def delete_job_rpc(job_id: str):
    print(f"[BACKEND_START] delete_job_rpc called with job_id={job_id}")
    init_db()
    try:
        result = delete_job(job_id)
        print(f"[BACKEND_SUCCESS] delete_job_rpc deleted {job_id}")
        return result
    except Exception as e:
        print(f"[BACKEND_ERROR] delete_job_rpc failed: {e}")
        raise

# Re-export for call_backend_function
__all__ = ["scrape_url", "crawl_domain_streaming", "run_agent_task_streaming", "get_history_rpc", "delete_job_rpc"]
