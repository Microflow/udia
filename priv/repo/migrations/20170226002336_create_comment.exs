###############################################################################
# The contents of this file are subject to the Common Public Attribution
# License Version 1.0. (the "License"); you may not use this file except in
# compliance with the License. You may obtain a copy of the License at
# https://raw.githubusercontent.com/udia-software/udia/master/LICENSE.
# The License is based on the Mozilla Public License Version 1.1, but
# Sections 14 and 15 have been added to cover use of software over a computer
# network and provide for limited attribution for the Original Developer.
# In addition, Exhibit A has been modified to be consistent with Exhibit B.
#
# Software distributed under the License is distributed on an "AS IS" basis,
# WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License for
# the specific language governing rights and limitations under the License.
#
# The Original Code is UDIA.
#
# The Original Developer is the Initial Developer.  The Initial Developer of
# the Original Code is Udia Software Incorporated.
#
# All portions of the code written by UDIA are Copyright (c) 2016-2017
# Udia Software Incorporated. All Rights Reserved.
###############################################################################
defmodule Udia.Repo.Migrations.CreateComment do
  use Ecto.Migration

  def change do
    create table(:logs_comments) do
      add :body, :string
      add :post_id, references(:logs_posts, on_delete: :delete_all)
      add :parent_comment_id, references(:logs_comments, on_delete: :nothing)
      add :user_id, references(:auths_users, on_delete: :nilify_all)

      timestamps(type: :utc_datetime)
    end
    create index(:logs_comments, [:post_id])
    create index(:logs_comments, [:parent_comment_id])
    create index(:logs_comments, [:user_id])

  end
end
