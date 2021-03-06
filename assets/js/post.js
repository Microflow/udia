/////////////////////////////////////////////////////////////////////////////
// The contents of this file are subject to the Common Public Attribution
// License Version 1.0. (the "License"); you may not use this file except in
// compliance with the License. You may obtain a copy of the License at
// https://raw.githubusercontent.com/udia-software/udia/master/LICENSE.
// The License is based on the Mozilla Public License Version 1.1, but
// Sections 14 and 15 have been added to cover use of software over a computer
// network and provide for limited attribution for the Original Developer.
// In addition, Exhibit A has been modified to be consistent with Exhibit B.
//
// Software distributed under the License is distributed on an "AS IS" basis,
// WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License for
// the specific language governing rights and limitations under the License.
//
// The Original Code is UDIA.
//
// The Original Developer is the Initial Developer.  The Initial Developer of
// the Original Code is Udia Software Incorporated.
//
// All portions of the code written by UDIA are Copyright (c) 2016-2017
// Udia Software Incorporated. All Rights Reserved.
///////////////////////////////////////////////////////////////////////////
import {Presence} from "phoenix"

let Post = {
  init(socket, element) {
    if (!element) {
      return
    }
    let postId = element.getAttribute("data-id")
    socket.connect()
    this.onReady(postId, socket)
  },

  onReady(postId, socket) {
    let postChannel = socket.channel("post:" + postId)
    let msgContainer = document.getElementById("msg-container")

    // These elements only exist when the user is authenticated.
    let msgInput = document.getElementById("msg-input")
    let submitCommentButton = document.getElementById("msg-submit")

    let voteUpLink = document.getElementById("vote-up-link")
    let voteDownLink = document.getElementById("vote-down-link")
    let voteSpan = document.getElementById("vote-span")

    if (voteUpLink) {
      voteUpLink.addEventListener("click", e => {
        postChannel.push("up_vote", {}).receive("error", e => console.log(e))
      })
    }

    if (voteDownLink) {
      voteDownLink.addEventListener("click", e => {
        postChannel.push("down_vote", {}).receive("error", e => console.log(e))
      })
    }

    // Submit a comment
    if (submitCommentButton) {
      submitCommentButton.addEventListener("click", e => {
        let payload = {
          body: msgInput.value
        }
        postChannel.push("new_comment", payload)
          .receive("error", e => console.log(e))
        msgInput.value = ""
      })
    }

    // On new comment, render in message container
    postChannel.on("new_comment", (resp) => {
      postChannel.params.last_seen_id = resp.rendered_comment.id
      if (resp.id == window.userId) {
        this.renderComment(msgContainer, postChannel, resp.id, resp.rendered_comment)
      } else {
        this.renderComment(msgContainer, postChannel, window.userId, resp.rendered_comment)
      }
    })

    // On edit comment
    postChannel.on("edit_comment", resp => {
      postChannel.params.last_seen_id = resp.rendered_comment.id
      if (resp.id != window.userId) {
        this.removeComment(msgContainer, resp)
      }
      this.replaceComment(msgContainer, resp)
    })

    // On reply comment
    postChannel.on("reply_comment", resp => {
      if (resp.id == window.userId) {
        this.renderComment(msgContainer, postChannel, resp.id, resp.rendered_comment)
      } else {
        this.renderComment(msgContainer, postChannel, window.userId, resp.rendered_comment)
      }
    })

    // On delete comment
    postChannel.on("delete_comment", resp => {
      postChannel.params.last_seen_id = resp.rendered_comment.id
      let id = resp.rendered_comment.id
      let actions = document.getElementById(`actions-${id}`)
      let bodyComment = document.getElementById(`body-comment-${id}`)
      bodyComment.textContent = "[Deleted!]"
      if (resp.id == window.userId) {
        while (actions.childNodes.length > 0) {
          actions.removeChild(actions.childNodes[0])
        }
      } else {
        let reply = document.getElementById(`reply-comment-${id}`)
        actions.removeChild(reply)
      }
    })

    // Up vote event
    postChannel.on("up_vote", resp => {
      voteSpan.textContent = resp.point
        if (resp.id == window.userId) {
            if (resp.value == 1) {
                $(voteUpLink).addClass("green").removeClass("inverted");
                $(voteDownLink).addClass("red").addClass("inverted");
            } else {
                $(voteUpLink).removeClass("green").removeClass("inverted");
                $(voteDownLink).removeClass("red").removeClass("inverted");
            }
        }
    })

    // Down vote event
    postChannel.on("down_vote", resp => {
      voteSpan.textContent = resp.point
        if (resp.id == window.userId) {

            if (resp.value == -1) {
                $(voteUpLink).addClass("green").addClass("inverted");
                $(voteDownLink).addClass("red").removeClass("inverted");
            } else {
                $(voteUpLink).removeClass("green").removeClass("inverted");
                $(voteDownLink).removeClass("red").removeClass("inverted");
            }
        }
    })

    // Up vote comment
    postChannel.on("up_vote_comment", resp => {
      let voteSpan = document.getElementById(`vote-span-${resp.comment_id}`)
      let voteUpLink = document.getElementById(`vote-up-link-${resp.comment_id}`)
      let voteDownLink = document.getElementById(`vote-down-link-${resp.comment_id}`)
      voteSpan.textContent = resp.point
      if (resp.id == window.userId) {
        if (resp.value == 1) {
          $(voteUpLink).addClass("green").removeClass("inverted")
          $(voteDownLink).addClass("red").addClass("inverted")
        } else {
          $(voteUpLink).removeClass("green").removeClass("inverted")
          $(voteDownLink).removeClass("red").removeClass("inverted")
        }
      }
    })

    // Down vote comment
    postChannel.on("down_vote_comment", resp => {
      let voteSpan = document.getElementById(`vote-span-${resp.comment_id}`)
      let voteUpLink = document.getElementById(`vote-up-link-${resp.comment_id}`)
      let voteDownLink = document.getElementById(`vote-down-link-${resp.comment_id}`)
      voteSpan.textContent = resp.point
      if (resp.id == window.userId) {
        if (resp.value == -1) {
          $(voteUpLink).addClass("green").addClass("inverted")
          $(voteDownLink).addClass("red").removeClass("inverted")
        } else {
          $(voteUpLink).removeClass("green").removeClass("inverted")
          $(voteDownLink).removeClass("red").removeClass("inverted")
        }
      }
    })

    // On join channel, get all comments
    postChannel.join()
      .receive("ok", resp => {
        if (resp.point == null) {
          voteSpan.textContent = "0"
        } else {
          voteSpan.textContent = resp.point
        }

        if (resp.value == 1) {
          $(voteUpLink).addClass("green").removeClass("inverted");
          $(voteDownLink).addClass("red").addClass("inverted");
        } else if (resp.value == -1) {
          $(voteDownLink).addClass("red").removeClass("inverted");
          $(voteUpLink).addClass("green").addClass("inverted");
        }
        let ids = resp.comments.map(comment => comment.id)
        if (ids.length > 0) {
          postChannel.params.last_seen_id = Math.max(...ids)
        }
        resp.comments.filter(comment => {
          this.renderComment(msgContainer, postChannel, resp.id, comment)
        })
      })
      .receive("error", reason => console.log("join failed", reason))

    let presences = {}

    postChannel.on("presence_state", state => {
      presences = Presence.syncState(presences, state)
      this.renderPresence(presences)
    })
    postChannel.on("presence_diff", diff => {
      presences = Presence.syncDiff(presences, diff)
      this.renderPresence(presences)
    })
  },

  esc(str) {
    let div = document.createElement("div")
    div.appendChild(document.createTextNode(str))
    return div.innerHTML
  },

  replaceComment(msgContainer, resp) {
    let newBodyComment = document.createElement("div")
    newBodyComment.id = `body-comment-${resp.rendered_comment.id}`
    newBodyComment.innerHTML = `${resp.rendered_comment.body}`
    let commentText = document.getElementById(`comment-text-${resp.rendered_comment.id}`)
    commentText.appendChild(newBodyComment)
    msgContainer.scrollTop = msgContainer.scrollHeight
  },

  removeComment(msgContainer, resp) {
    let commentText = document.getElementById(`comment-text-${resp.rendered_comment.id}`)
    let bodyComment = document.getElementById(`body-comment-${resp.rendered_comment.id}`)
    commentText.removeChild(bodyComment)
    msgContainer.scrollTop = msgContainer.scrollHeight
  },

  renderComment(msgContainer, postChannel, userId, {
    user,
    id,
    point,
    votes,
    parent_id,
    body
  }) {
    let template = document.createElement("div")
    template.id = `template-${id}`

    // Check null user for the deleted case

    if (user == null) {

      if (parent_id != null) {
        template.className = "ui comments"
        template.innerHTML = `
        <div class="comment">
          <div class="content">
            <div>[Deleted]</div>
            <div class="text">
              <div>Deleted!</div>
            </div>
          </div>
        </div>
        ` 
        let parentTemplate = document.getElementById(`template-${parent_id}`)
        parentTemplate.appendChild(template)
      } else {
        template.className = "comment"
        template.innerHTML = `
          <div class="content">
            <div>[Deleted]</div>
            <div class="text">
              <div>Deleted!</div>
            </div>
          </div>
        `
        msgContainer.appendChild(template)
      }

    } else {

     if (parent_id != null) {
      let replyTemplate = document.createElement("div")
      replyTemplate.className = "ui comments"
      replyTemplate.id = `template-${id}`

      if (userId == user.id) {
        replyTemplate.innerHTML = `
        <div class="ui unstackable items">
          <div class="item">
            <div class="vote ui list">
              <button class="mini ui icon basic button" id="vote-up-link-${id}">
                <i class="chevron circle up icon"></i>
              </button>
              <span id="vote-span-${id}" class="item">...</span>
              <button class="mini ui icon basic button" id="vote-down-link-${id}">
                <i class="chevron circle down icon"></i>
              </button>
            </div>

            <div class="comment">
              <div class="content">
                <a href="/users/${user.id}">${this.esc(user.username)}</a>
                <div class="metadata">
                  <span class="date">Today at 5:42PM (STUB)</span>
                </div>
                <div class="text" id="comment-text-${id}">
                  <div id="body-comment-${id}">${body}</div>
                </div>
                <div class="actions" id="actions-${id}">
                  <a class="reply" id="reply-comment-${id}">Reply</a>
                  <a class="edit" id="edit-comment-${id}">Edit</a>
                  <a class="delete" id="delete-comment-${id}">Delete</a>
                </div>
              </div>
            </div>            
          </div>
        </div>        

        `
        let parentTemplate = document.getElementById(`template-${parent_id}`)
        parentTemplate.appendChild(replyTemplate)
        this.editAndDeleteListener(msgContainer, postChannel, id)

      } else {

        replyTemplate.innerHTML = `
        <div class="ui unstackable items">
          <div class="item">
            <div class="vote ui list">
              <button class="mini ui icon basic button" id="vote-up-link-${id}">
                <i class="chevron circle up icon"></i>
              </button>
              <span id="vote-span-${id}" class="item">...</span>
              <button class="mini ui icon basic button" id="vote-down-link-${id}">
                <i class="chevron circle down icon"></i>
              </button>
            </div>

            <div class="comment">
              <div class="content">
                <a href="/users/${user.id}">${this.esc(user.username)}</a>
                <div class="metadata">
                  <span class="date">Today at 5:42PM (STUB)</span>
                </div>
                <div class="text" id="comment-text-${id}">
                  <div id="body-comment-${id}">${body}</div>
                </div>
                <div class="actions" id="actions-${id}">
                  <a class="reply" id="reply-comment-${id}">Reply</a>
                </div>
              </div>
            </div>            
          </div>
        </div>
        `
        let parentTemplate = document.getElementById(`template-${parent_id}`)
        parentTemplate.appendChild(replyTemplate)
      }

     } else {

      if (userId == user.id) {
      template.className = "comment"
      template.innerHTML = `
        <div class="ui unstackable items">
          <div class="item">
            <div class="vote ui list">
              <button class="mini ui icon basic button" id="vote-up-link-${id}">
                <i class="chevron circle up icon"></i>
              </button>
              <span id="vote-span-${id}" class="item">...</span>
              <button class="mini ui icon basic button" id="vote-down-link-${id}">
                <i class="chevron circle down icon"></i>
              </button>
            </div>

            <div class="content">
              <a href="/users/${user.id}" class="author">${this.esc(user.username)}</a>
              <div class="metadata">
                <span class="date">Today at 5:42PM (STUB)</span>
              </div>
              <div class="text" id="comment-text-${id}">
                <div id="body-comment-${id}">${body}</div>
              </div>
              <div class="actions" id="actions-${id}">
                <a class="reply" id="reply-comment-${id}">Reply</a>
                <a class="edit" id="edit-comment-${id}">Edit</a>
                <a class="delete" id="delete-comment-${id}">Delete</a>
              </div>
            </div>
          </div>
        </div>     
      `
      msgContainer.appendChild(template)
      msgContainer.scrollTop = msgContainer.scrollHeight
      this.editAndDeleteListener(msgContainer, postChannel, id)

     } else {
      template.className = "comment"
      template.innerHTML = `
        <div class="ui unstackable items">
          <div class="item">
            <div class="vote ui list">
              <button class="mini ui icon basic button" id="vote-up-link-${id}">
                <i class="chevron circle up icon"></i>
              </button>
              <span id="vote-span-${id}" class="item">...</span>
              <button class="mini ui icon basic button" id="vote-down-link-${id}">
                <i class="chevron circle down icon"></i>
              </button>
            </div>

            <div class="content">
              <a href="/users/${user.id}" class="author">${this.esc(user.username)}</a>
              <div class="metadata">
                <span class="date">Today at 5:42PM (STUB)</span>
              </div>
              <div class="text" id="comment-text-${id}">
                <div id="body-comment-${id}">${body}</div>
              </div>
              <div class="actions" id="actions-${id}">
                <a class="reply" id="reply-comment-${id}">Reply</a>
              </div>
            </div>
          </div>
        </div> 
      `
       msgContainer.appendChild(template)
       msgContainer.scrollTop = msgContainer.scrollHeight
     }
    }
    this.replyListener(postChannel, id)
    this.voteListener(postChannel, id)
    let voteSpan = document.getElementById(`vote-span-${id}`)
    let voteUpLink = document.getElementById(`vote-up-link-${id}`)
    let voteDownLink = document.getElementById(`vote-down-link-${id}`)
    if (point == null) {
      voteSpan.textContent = 0
    } else {
      voteSpan.textContent = point
    }

    votes.forEach(vote => {
      if (vote.user_id == window.userId && vote.vote == 1) {
        $(voteUpLink).addClass("green").removeClass("inverted")
        $(voteDownLink).addClass("red").addClass("inverted")
      } else if (vote.user_id == window.userId && vote.vote == -1) {
        $(voteDownLink).addClass("red").removeClass("inverted")
        $(voteUpLink).addClass("green").addClass("inverted")
      }
    })
  }

  },

  voteListener(postChannel, id) {
    let voteUpLink = document.getElementById(`vote-up-link-${id}`)
    let voteDownLink = document.getElementById(`vote-down-link-${id}`)

    voteUpLink.addEventListener("click", () => {
      postChannel.push("up_vote_comment", {id: id})
    })
    voteDownLink.addEventListener("click", () => {
      postChannel.push("down_vote_comment", {id: id})
    })
  },

  replyListener(postChannel, id) {

   // Reply a comment eventListener
   let replyBtn = document.getElementById(`reply-comment-${id}`)
   replyBtn.addEventListener("click", () => {
    let formReply = document.createElement("div")
    formReply.className = "ui form"
    formReply.innerHTML = `
      <div class="field">
        <textarea rows="3" id="reply-input-${id}"></textarea>
      </div>
      <div class="ui basic button" id="reply-cancel-${id}">Cancel</div>
      <div class="ui positive button" id="reply-save-${id}">Save</div>
    `
    let template = document.getElementById(`template-${id}`)
    template.appendChild(formReply)

    //Reply cancel
    $(`#reply-cancel-${id}`).on("click", () => {
      template.removeChild(formReply)
    })

    //Reply submit
    $(`#reply-save-${id}`).on("click", () => {
      let replyInput = $(`#reply-input-${id}`)
      postChannel.push("reply_comment", {id: id, body: replyInput.val()})
      replyInput.val("")
      template.removeChild(formReply)
    })
   })    
 },

  editAndDeleteListener(msgContainer, postChannel, id) {
    let editBtn = document.getElementById(`edit-comment-${id}`)
    let deleteBtn = document.getElementById(`delete-comment-${id}`)

    let modal = document.createElement("div")
    modal.innerHTML = `
      <div class="ui small modal" id="small-modal-${id}">
        <div class="content">
          <p>Are you sure you want to delete this comment?</p>
        </div>
        <div class="actions">
          <div class="ui cancel button" id="cancel-${id}">Cancel</div>
          <div class="ui negative button" id="approve-${id}">Yes, Delete this comment!</div>
        </div>
      </div>
    `
    msgContainer.appendChild(modal)
    let commentText = document.getElementById(`comment-text-${id}`) 

    // Edit a comment eventListener
    editBtn.addEventListener("click", () => {
      let formInput = document.createElement("div")
      formInput.id = `form-${id}`
      formInput.innerHTML = `
      <div class="ui mini form">
        <div class="field">
          <textarea rows="2" id="textarea-${id}"></textarea>
        </div>
        <div class="ui basic button" id="edit-cancel-${id}">Cancel</div>
        <div class="ui basic positive button" id="edit-submit-${id}">Save Changes</div>
      </div>
      `
      let bodyComment = document.getElementById(`body-comment-${id}`)
      let bodyValue = bodyComment.textContent
      commentText.removeChild(bodyComment)
      commentText.appendChild(formInput)
      $(`#textarea-${id}`).val(bodyValue)
      $(`#textarea-${id}`).focus()

      $(`#edit-cancel-${id}`).on("click", () => {
        commentText.removeChild(formInput)
        commentText.appendChild(bodyComment)
      })
      $(`#edit-submit-${id}`).on("click", () => {
        postChannel.push("edit_comment", {id: id, body: $(`#textarea-${id}`).val()})
        commentText.removeChild(formInput)
      })
    })

    // Delete a comment eventListener
    deleteBtn.addEventListener("click", () => {
      $(`#small-modal-${id}`).modal('show')
      $(`#approve-${id}`).on("click", () => {
        postChannel.push("delete_comment", {id: id})
      })
      $(`#cancel-${id}`).on("click", () => {
        $(`#small-modal-${id}`).modal('close')
      })
    })    
  },

  renderPresence(presences) {
    let userList = document.getElementById("user-list")
    let listBy = (id, {
      metas: metas
    }) => {
      let onlineAtDate = new Date(metas[0].online_at);
      return {
        id: id,
        username: metas[0].username,
        count: metas.length,
        onlineAt: onlineAtDate.toLocaleDateString() + " " + onlineAtDate.toLocaleTimeString()
      }
    }

    userList.innerHTML = Presence.list(presences, listBy)
      .map(user => `<li>${user.username} (instance count: ${user.count}) <span>Online At ${user.onlineAt}</span></li>`)
      .join("")
  }
}

export default Post
